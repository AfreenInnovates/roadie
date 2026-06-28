from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import redis
import os
import json
import time

from app.services.anakin_service import fetch_bandsintown_tours, fetch_airbnb_listings
from app.services.intelligence_service import generate_airbnb_recommendation

router = APIRouter()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

try:
    if REDIS_PASSWORD:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=0, decode_responses=True)
    else:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    redis_client.ping()
except Exception as e:
    redis_client = None

class TourRequest(BaseModel):
    artist: str

class AirbnbRequest(BaseModel):
    city: str
    date: str

@router.post("/tours")
async def get_tours(req: TourRequest):
    artist = req.artist.strip().lower()
    if not artist:
        raise HTTPException(status_code=400, detail="Artist name cannot be empty.")

    cache_key = f"tours:{artist}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

    try:
        data = fetch_bandsintown_tours(artist)
        if redis_client and not data.get("is_dummy", False):
            redis_client.setex(cache_key, 300, json.dumps(data))
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/airbnb")
async def get_airbnb(req: AirbnbRequest):
    city = req.city.strip()
    date = req.date.strip()
    
    if not city or not date:
        raise HTTPException(status_code=400, detail="City and Date required.")

    cache_key = f"airbnb:{city}:{date}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

    try:
        # 1. Fetch from Anakin Airbnb API (mocked)
        data = fetch_airbnb_listings(city, date)
        
        # 2. Ask Groq for the best pick
        recommendation = generate_airbnb_recommendation(city, date, data['listings'])
        
        response_payload = {
            "airbnb_data": data,
            "groq_recommendation": recommendation
        }
        
        if redis_client:
            redis_client.setex(cache_key, 300, json.dumps(response_payload))
            
        return response_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
