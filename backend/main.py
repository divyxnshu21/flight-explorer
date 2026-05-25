import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from airports import all_airports_list, fuzzy_search, AIRPORTS_DB
from flights import search_many
from ai import ai_destination_search, transcribe_audio

SERPAPI_KEY   = os.getenv("SERPAPI_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_KEY", "")

app = FastAPI(title="FlightDesk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tightened to Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    origin:       str         = Field("DEL", description="IATA origin code")
    destinations: list[str]   = Field(..., min_length=1)
    dep_date:     str         = Field(..., description="YYYY-MM-DD")
    ret_date:     str | None  = Field(None, description="YYYY-MM-DD, omit for one-way")
    trip_type:    int         = Field(1, description="1=round-trip, 2=one-way")
    adults:       int         = Field(1, ge=1, le=9)
    cabin:        int         = Field(1, description="1=Economy 2=Premium 3=Business 4=First")
    currency:     str         = Field("INR", description="ISO 4217 currency code")


class AISearchRequest(BaseModel):
    query: str = Field(..., min_length=2)


class TranscribeRequest(BaseModel):
    audio_b64:    str = Field(..., description="Base64-encoded raw PCM bytes")
    sample_rate:  int = Field(16000)
    sample_width: int = Field(2)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/airports")
def get_airports():
    """Full airport list for autocomplete (sorted by IATA code)."""
    return all_airports_list()


@app.get("/api/airports/search")
def search_airports(q: str = Query(..., min_length=1), limit: int = Query(12, ge=1, le=30)):
    """Fuzzy-search airports by city, name, or country."""
    return fuzzy_search(q, max_results=limit)


@app.get("/api/airports/{code}")
def get_airport(code: str):
    code = code.upper()
    info = AIRPORTS_DB.get(code)
    if not info:
        raise HTTPException(status_code=404, detail=f"Airport {code} not found")
    return {"code": code, **info}


@app.post("/api/search")
def search_flights(req: SearchRequest):
    """Parallel SerpAPI search across all requested destinations."""
    if not SERPAPI_KEY:
        raise HTTPException(status_code=503, detail="SERPAPI_KEY not configured")

    unknown = [d for d in req.destinations if d not in AIRPORTS_DB]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown IATA codes: {unknown}")

    results, errors = search_many(
        api_key      = SERPAPI_KEY,
        origin       = req.origin.upper(),
        destinations = [d.upper() for d in req.destinations],
        dep_date     = req.dep_date,
        ret_date     = req.ret_date,
        trip_type    = req.trip_type,
        adults       = req.adults,
        cabin        = req.cabin,
        currency     = req.currency.upper(),
    )
    return {"results": results, "errors": errors}


@app.post("/api/ai-search")
def ai_search(req: AISearchRequest):
    """Claude-powered vibe/region search → IATA codes."""
    if not ANTHROPIC_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_KEY not configured")
    codes, err = ai_destination_search(req.query, ANTHROPIC_KEY)
    if err and not codes:
        raise HTTPException(status_code=502, detail=err)
    return {"codes": codes or [], "error": err}


@app.post("/api/transcribe")
def transcribe(req: TranscribeRequest):
    """Transcribe base64-encoded PCM audio via Google Speech."""
    import base64
    try:
        audio_bytes = base64.b64decode(req.audio_b64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 audio data")
    text = transcribe_audio(audio_bytes, req.sample_rate, req.sample_width)
    return {"text": text}


@app.get("/health")
def health():
    return {
        "status":    "ok",
        "serpapi":   bool(SERPAPI_KEY),
        "anthropic": bool(ANTHROPIC_KEY),
        "airports":  len(AIRPORTS_DB),
    }
