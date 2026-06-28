import json
import os
import re
import requests
from dotenv import load_dotenv
import redis
import easyocr
from app.utils.timer import Timer


load_dotenv()

DATA_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "data.json")
)

with open(DATA_PATH, "r", encoding="utf-8") as fh:
    METRO_DATA = json.load(fh)


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemma-4-31b-it:free"
)


REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")


_redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)


OCR_READER = easyocr.Reader(['en'])

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


def extract_text_from_image(image_path: str):
    result = OCR_READER.readtext(
        image_path,
        detail=0
    )

    extracted_text = "\n".join(result)
    return extracted_text


def extract_source_destination(text: str):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    source = None
    destination = None
    
    for i, line in enumerate(lines):
        if re.match(r"^(?:source\s*station|source|from)$", line, re.IGNORECASE):
            if i + 1 < len(lines):
                if not re.match(r"^(?:destination\s*station|destination|dest|to)$", lines[i+1], re.IGNORECASE):
                    source = lines[i+1].strip()
        elif re.match(r"^(?:destination\s*station|destination|dest|to)$", line, re.IGNORECASE):
            if i + 1 < len(lines):
                if not re.match(r"^(?:source\s*station|source|from)$", lines[i+1], re.IGNORECASE):
                    destination = lines[i+1].strip()
                    
    source_same_line = re.search(r"(?:source\s*station|source|from)\s*[:\-=]?\s*(.+)", text, re.IGNORECASE)
    destination_same_line = re.search(r"(?:destination\s*station|destination|dest|to)\s*[:\-=]?\s*(.+)", text, re.IGNORECASE)
    
    if not source and source_same_line:
        cand = source_same_line.group(1).strip()
        if cand and not re.match(r"^(?:station|:)$", cand, re.IGNORECASE):
            source = cand
            
    if not destination and destination_same_line:
        cand = destination_same_line.group(1).strip()
        if cand and not re.match(r"^(?:station|:)$", cand, re.IGNORECASE):
            destination = cand
            
    if not source:
        m = re.search(r"(?:source\s*station|source|from)\s*[\n\r]+\s*([^\n\r]+)", text, re.IGNORECASE)
        if m:
            source = m.group(1).strip()
            
    if not destination:
        m = re.search(r"(?:destination\s*station|destination|dest|to)\s*[\n\r]+\s*([^\n\r]+)", text, re.IGNORECASE)
        if m:
            destination = m.group(1).strip()

    if source:
        source = re.sub(r"^[:\-\s=]+|[:\-\s=]+$", "", source).strip()
    if destination:
        destination = re.sub(r"^[:\-\s=]+|[:\-\s=]+$", "", destination).strip()

    return source, destination


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


def generate_route_response(
    source: str,
    destination: str,
    route_info: dict
):

    prompt = f"""
    User wants to travel from {source} to {destination}.
    Metro Line:
    {route_info['line']}
    Number of Stops:
    {route_info['stops']}
    Stations:
    {", ".join(route_info['stations_between'])}

    Give concise and helpful metro travel guidance.
    Mention the line, stop count, and important station details clearly.
    """

    response = requests.post(

        url="https://openrouter.ai/api/v1/chat/completions",

        headers={

            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },

        data=json.dumps({

            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            "reasoning": {
                "enabled": True
            }

        })
    )

    if response.status_code != 200:

        return {
            "error": "OpenRouter API request failed",
            "status_code": response.status_code,
            "details": response.text
        }

    data = response.json()

    try:

        message = data["choices"][0]["message"]
        return {
            "response": message.get("content", ""),
            "reasoning_details": message.get("reasoning_details", [])
        }

    except Exception:
        return {
            "error": "Invalid OpenRouter response",
            "raw_response": data
        }


def analyze_ticket_image(image_path: str):

    total_timer = Timer()

    # OCR
    ocr_timer = Timer()
    extracted_text = extract_text_from_image(image_path)
    ocr_time = ocr_timer.elapsed()

    # SOURCE + DESTINATION EXTRACTION
    source, destination = extract_source_destination(extracted_text)

    if not source or not destination:
        return {
            "error": "Could not detect source/destination from image.",
            "ocr_text": extracted_text
        }

    normalized_source = normalize_station_name(source)
    normalized_destination = normalize_station_name(destination)
    cache_key = f"{normalized_source}:{normalized_destination}"

    # REDIS CACHE HIT
    cached_data = _redis_get(cache_key)

    if cached_data is not None:

        total_time = total_timer.elapsed()

        return {

            "cache_hit": True,
            "ocr_text": extracted_text,
            "source": normalized_source,
            "destination": normalized_destination,
            "response": cached_data.get("response"),
            "route_info": cached_data.get("route_info"),
            "metrics": {
                "cache_hit": True,
                "cache_size": _redis_size(),
                "ocr_time_sec": round(ocr_time, 3),
                "total_duration_sec": round(total_time, 3)
            }
        }

    # ROUTE RETRIEVAL
    retrieval_timer = Timer()
    route_info = find_route(source, destination)
    retrieval_time = retrieval_timer.elapsed()

    if not route_info:
        return {
            "error": "No route found."
        }

    # OPENROUTER INFERENCE
    inference_timer = Timer()

    llm_result = generate_route_response(
        source,
        destination,
        route_info
    )

    inference_time = inference_timer.elapsed()
    if "error" in llm_result:
        return llm_result
    response = llm_result["response"]
    reasoning_details = llm_result["reasoning_details"]

    # STORE CACHE
    _redis_set(cache_key, {
        "response": response,
        "route_info": route_info
    })

    total_time = total_timer.elapsed()

    return {

        "cache_hit": False,
        "ocr_text": extracted_text,
        "source": normalized_source,
        "destination": normalized_destination,
        "response": response,
        "reasoning_details": reasoning_details,
        "route_info": route_info,
        "metrics": {
            "cache_hit": False,
            "cache_size": _redis_size(),
            "ocr_time_sec": round(ocr_time, 3),
            "retrieval_time_sec": round(retrieval_time, 3),
            "inference_time_sec": round(inference_time, 3),
            "total_duration_sec": round(total_time, 3)
        }
    }