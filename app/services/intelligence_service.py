import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def generate_airbnb_recommendation(city: str, date: str, listings: list) -> str:
    """
    Uses Groq to act as the Ultimate Roadie and pick the best Airbnb listing from the scraped data.
    """
    if not client:
        return "Groq API Key not found. Please add it to your .env file."
        
    if not listings:
        return "No listings found."
        
    data_str = ""
    for idx, l in enumerate(listings):
        data_str += f"Option {idx+1}: {l['title']} - ${l['price_per_night_usd']}/night, Rating: {l['rating']}, Distance: {l['distance_to_venue_miles']} miles\n"
        
    prompt = f"""
    You are the 'Ultimate Roadie', an expert music fan and budget travel planner. 
    I am traveling to {city} for a concert on {date}.
    
    Here are the Airbnb listings scraped by Anakin:
    {data_str}
    
    Evaluate the price, rating, and distance to venue. Pick the absolute best option.
    Keep it under 3 sentences. Be energetic. 
    Format exactly like this:
    **The Roadie Pick:** (Name of listing)
    **Why:** (Your reasoning)
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a hype, energetic concert travel planner."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_completion_tokens=500,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Failed to generate recommendation via Groq API."
