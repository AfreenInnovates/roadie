import json
import os
import re
import requests
from dotenv import load_dotenv
import easyocr
from langchain_ollama import OllamaLLM
from app.utils.timer import Timer
load_dotenv()


DATA_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "data.json")
)

with open(DATA_PATH, "r", encoding="utf-8") as fh:
    METRO_DATA = json.load(fh)

OLLAMA_LLM = OllamaLLM(
    model="gemma4:e2b"
)

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY"
)

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "meta-llama/llama-3.3-8b-instruct:free"
)


OCR_READER = easyocr.Reader(['en'])

def normalize_station_name(name: str):

    name = name.lower().strip()

    aliases = {

        "majestic":
            "nadaprabhu kempegowda station (majestic)",
        "mg road":
            "mahatma gandhi road",
        "kr puram":
            "krishnarajapura (k.r. pura)"
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
    
    # Try line-by-line keyword mapping (multi-line layout)
    for i, line in enumerate(lines):
        if re.match(r"^(?:source\s*station|source|from)$", line, re.IGNORECASE):
            if i + 1 < len(lines):
                if not re.match(r"^(?:destination\s*station|destination|dest|to)$", lines[i+1], re.IGNORECASE):
                    source = lines[i+1].strip()
        elif re.match(r"^(?:destination\s*station|destination|dest|to)$", line, re.IGNORECASE):
            if i + 1 < len(lines):
                if not re.match(r"^(?:source\s*station|source|from)$", lines[i+1], re.IGNORECASE):
                    destination = lines[i+1].strip()
                    
    # Same-line matchers (e.g. "Source Station : Cubbon Park")
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
            
    # Fallback to multi-line regex
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
            path = stations[
                min(source_idx, dest_idx):
                max(source_idx, dest_idx) + 1
            ]
            # preserve actual travel direction
            if source_idx > dest_idx:

                path = path[::-1]
            return {
                "line": line["line_name"],
                "stops": abs(dest_idx - source_idx),
                "stations_between": path
            }

    return None

def analyze_with_ollama(image_path: str):

    total_timer = Timer()

    # OCR

    ocr_timer = Timer()

    extracted_text = extract_text_from_image(
        image_path
    )

    ocr_time = ocr_timer.elapsed()

    source, destination = extract_source_destination(
        extracted_text
    )
    if not source or not destination:

        return {
            "error": "Could not extract stations."
        }
    retrieval_timer = Timer()

    route_info = find_route(
        source,
        destination
    )

    retrieval_time = retrieval_timer.elapsed()

    if not route_info:

        return {
            "error": "No route found."
        }

    # LLM

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

    response = OLLAMA_LLM.invoke(prompt)

    inference_time = inference_timer.elapsed()

    total_time = total_timer.elapsed()

    return {

        "pipeline": "ollama_local",
        "model": "gemma4:e2b",
        "deployment": "local",
        "quantization": "Q4_K_M",
        "ocr_text": extracted_text,
        "source": source,
        "destination": destination,
        "response": response,
        "route_info": route_info,
        "metrics": {
            "ocr_time_sec":
                round(ocr_time, 3),
            "retrieval_time_sec":
                round(retrieval_time, 3),
            "inference_time_sec":
                round(inference_time, 3),
            "total_duration_sec":
                round(total_time, 3)
        }
    }


def analyze_with_openrouter(image_path: str):

    total_timer = Timer()

    # OCR

    ocr_timer = Timer()

    extracted_text = extract_text_from_image(
        image_path
    )

    ocr_time = ocr_timer.elapsed()

    source, destination = extract_source_destination(
        extracted_text
    )

    if not source or not destination:

        return {
            "error": "Could not extract stations."
        }

    # ROUTE

    retrieval_timer = Timer()

    route_info = find_route(
        source,
        destination
    )

    retrieval_time = retrieval_timer.elapsed()

    if not route_info:

        return {
            "error": "No route found."
        }

    # OPENROUTER

    prompt = f"""
    User wants to travel from {source} to {destination}.

    Metro Line:
    {route_info['line']}

    Stops:
    {route_info['stops']}

    Stations:
    {", ".join(route_info['stations_between'])}

    Give concise and helpful metro travel guidance.
    """

    inference_timer = Timer()

    response = requests.post(

        url="https://openrouter.ai/api/v1/chat/completions",

        headers={

            "Authorization":
                f"Bearer {OPENROUTER_API_KEY}",

            "Content-Type":
                "application/json",
        },

        data=json.dumps({

            "model": OPENROUTER_MODEL,

            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]

        })
    )

    inference_time = inference_timer.elapsed()

    data = response.json()

    print("\nOPENROUTER RESPONSE:")
    print(json.dumps(data, indent=2))

    if "choices" not in data:

        return {

            "pipeline": "openrouter_cloud",

            "error": data
        }

    message = data["choices"][0]["message"]

    total_time = total_timer.elapsed()

    return {

        "pipeline": "openrouter_cloud",

        "model": OPENROUTER_MODEL,

        "deployment": "cloud",

        "ocr_text": extracted_text,

        "source": source,

        "destination": destination,

        "response": message.get("content", ""),

        "route_info": route_info,

        "metrics": {

            "ocr_time_sec":
                round(ocr_time, 3),

            "retrieval_time_sec":
                round(retrieval_time, 3),

            "inference_time_sec":
                round(inference_time, 3),

            "total_duration_sec":
                round(total_time, 3)
        }
    }


def benchmark_image_models(image_path: str):

    ollama_result = analyze_with_ollama(
        image_path
    )

    openrouter_result = analyze_with_openrouter(
        image_path
    )

    return {

        "ollama_local_quantized":
            ollama_result,

        "openrouter_cloud":
            openrouter_result
    }