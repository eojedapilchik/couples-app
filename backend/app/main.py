"""FastAPI main application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.api import api_router

app = FastAPI(
    title="Couple Cards + Dares API",
    description="API para el juego de cartas y retos para parejas",
    version="1.0.0",
)

# CORS - Allow all origins for local LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def startup():
    """Create tables on startup."""
    create_tables()


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Couple Cards API"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
