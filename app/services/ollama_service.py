import json
import os
from dotenv import load_dotenv
import redis
from langchain_ollama import OllamaLLM
from app.utils.timer import Timer

DATA_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "data.json")
)

with open(DATA_PATH, "r", encoding="utf-8") as fh:
    METRO_DATA = json.load(fh)

LLM = OllamaLLM(model="gemma4:e2b")

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

_redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)

def _redis_get(key: str):
    try:
        val = _redis_client.get(key)
        return json.loads(val) if val is not None else None
    except Exception:
        return None

def _redis_set(key: str, value: dict):
    try:
        _redis_client.set(key, json.dumps(value))
    except Exception:
        pass

def _redis_size():
    try:
        return int(_redis_client.dbsize())
    except Exception:
        return 0

def normalize_station_name(name: str):

    name = name.lower().strip()

    aliases = {
        "majestic": "nadaprabhu kempegowda station (majestic)",
        "mg road": "mahatma gandhi road",
        "kr puram": "krishnarajapura (k.r. pura)"
    }

    return aliases.get(name, name)

def find_route(source: str, destination: str):

    source = normalize_station_name(source)
    destination = normalize_station_name(destination)

    for line in METRO_DATA["metro_lines"]:

        stations = line["stations"]

        stations_lower = [s.lower() for s in stations]

        if source in stations_lower and destination in stations_lower:

            source_idx = stations_lower.index(source)
            dest_idx = stations_lower.index(destination)

            return {

                "line": line["line_name"],

                "stops": abs(dest_idx - source_idx),

                "stations_between": stations[
                    min(source_idx, dest_idx):
                    max(source_idx, dest_idx) + 1
                ]
            }

    return None

def analyze_route(source: str, destination: str):

    total_timer = Timer()

    # normalize + cache key
    normalized_source = normalize_station_name(source)
    normalized_destination = normalize_station_name(destination)

    cache_key = f"{normalized_source}:{normalized_destination}"

    # CACHE HIT (Redis)
    cached_data = _redis_get(cache_key)
    if cached_data is not None:
        total_time = total_timer.elapsed()
        return {
            "cache_hit": True,
            "response": cached_data.get("response"),
            "route_info": cached_data.get("route_info"),
            "metrics": {
                "cache_hit": True,
                "cache_size": _redis_size(),
                "total_duration_sec": round(total_time, 3)
            }
        }

    # CACHE MISS
    retrieval_timer = Timer()
    route_info = find_route(source, destination)
    retrieval_time = retrieval_timer.elapsed()
    if not route_info:
        return {
            "error": "No route found."
        }

    prompt = f"""
    User wants to travel from {source} to {destination}.

    Metro Line:
    {route_info['line']}

    Stops:
    {route_info['stops']}

    Stations:
    {", ".join(route_info['stations_between'])}

    Give concise travel guidance.
    """
    inference_timer = Timer()

    response = LLM.invoke(prompt)

    inference_time = inference_timer.elapsed()

    # Store in Redis cache
    _redis_set(cache_key, {
        "response": response,
        "route_info": route_info
    })

    total_time = total_timer.elapsed()
    
    return {
        "cache_hit": False,
        "response": response,
        "route_info": route_info,
        "metrics": {
            "cache_hit": False,
            "cache_size": _redis_size(),
            "retrieval_time_sec": round(retrieval_time, 3),
            "inference_time_sec": round(inference_time, 3),
            "total_duration_sec": round(total_time, 3)
        }
    }