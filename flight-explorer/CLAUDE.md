# Flight Explorer — Project Context for Claude Code

## What this is
A Streamlit web app that searches Google Flights for multiple destinations in parallel via SerpAPI.
Users can search by text, voice, or browse preset regional tabs. Results show as a sortable table + bar chart.

## Stack
- Frontend/backend: Streamlit (Python)
- Flight data: SerpAPI → Google Flights engine
- Airport data: airportsdata package (~7000 airports)
- AI search: Anthropic API (Claude claude-sonnet-4-20250514)
- Voice: streamlit-mic-recorder + SpeechRecognition (Google free API)
- Charts: Plotly

## Key files
- app.py — main Streamlit app (all logic in one file for now)
- requirements.txt — Python dependencies
- .env — API keys (never commit this)

## Current features
- Multi-destination parallel flight search (round-trip + one-way)
- Smart airport fuzzy search across 7000+ airports
- AI destination search ("beaches SE Asia", "budget Europe")
- Voice input → transcription → airport search
- Preset regional tabs (SE Asia, Middle East, India domestic, etc.)
- Price filters, direct-only toggle, sort by price/duration
- CSV export
- Bar chart of cheapest fares per destination

## What to improve / ideas
- Better UI (move from Streamlit to a proper React frontend)
- Price calendar heatmap (cheapest day to fly)
- Flexible date search (±3 days)
- Price alerts / tracking
- Multi-city routing
- Compare round-trip vs one-way pricing
- Hotel/accommodation search integration
- Save favourite searches
- Share results as link
- Mobile-responsive design

## Run locally
pip install -r requirements.txt
streamlit run app.py

## API keys
Stored in .env — load with python-dotenv. Never hardcode in app.py.

## User
Divyanshu Singh — Indian user, flying from DEL (Delhi), interested in SE Asia, Middle East, and Indian domestic travel. Prefers INR pricing.
