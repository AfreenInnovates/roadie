from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import roadtrip

app = FastAPI(title="Groupie Road-Trip Planner")

# Allow React Native Web to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roadtrip.router, prefix="/api", tags=["Roadtrip"])