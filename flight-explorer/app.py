import os
from dotenv import load_dotenv
load_dotenv()

"""
Flight Explorer — multi-destination Google Flights search via SerpAPI
Run with:  streamlit run app.py
"""

SERPAPI_KEY   = os.getenv("SERPAPI_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_KEY", "")

import streamlit as st
import pandas as pd
import requests
import plotly.express as px
import airportsdata
import json
from datetime import date, timedelta, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.parse
import streamlit.components.v1 as components

try:
    from streamlit_mic_recorder import mic_recorder
    import speech_recognition as sr
    VOICE_OK = True
except Exception:
    VOICE_OK = False

# ── AIRPORT DATABASE ──────────────────────────────────────────
@st.cache_data
def load_airports():
    raw = airportsdata.load("IATA")
    return {k: v for k, v in raw.items() if k and len(k) == 3 and v.get("city")}

AIRPORTS_DB = load_airports()

COUNTRY_NAMES = {
    "TH":"Thailand","VN":"Vietnam","ID":"Indonesia","MY":"Malaysia","SG":"Singapore",
    "KH":"Cambodia","LA":"Laos","MM":"Myanmar","IN":"India","MV":"Maldives",
    "LK":"Sri Lanka","NP":"Nepal","AE":"UAE","OM":"Oman","QA":"Qatar","BH":"Bahrain",
    "JP":"Japan","KR":"South Korea","CN":"China","HK":"Hong Kong","TW":"Taiwan",
    "PH":"Philippines","AU":"Australia","NZ":"New Zealand","GB":"UK","FR":"France",
    "DE":"Germany","IT":"Italy","ES":"Spain","PT":"Portugal","GR":"Greece",
    "US":"USA","CA":"Canada","MX":"Mexico","BR":"Brazil","ZA":"South Africa",
    "EG":"Egypt","KE":"Kenya","MA":"Morocco","TR":"Turkey","NL":"Netherlands",
    "CH":"Switzerland","AT":"Austria","BE":"Belgium","SE":"Sweden","NO":"Norway",
    "DK":"Denmark","FI":"Finland","PL":"Poland","CZ":"Czech Republic",
}

def airport_label(code):
    info    = AIRPORTS_DB.get(code, {})
    city    = info.get("city", "")
    country = COUNTRY_NAMES.get(info.get("country",""), info.get("country",""))
    name    = info.get("name","")
    return f"{code} — {city}, {country} ({name})"

def fuzzy_search(query, max_results=12):
    q = query.lower().strip()
    if not q:
        return []
    results = []
    for code, info in AIRPORTS_DB.items():
        city    = info.get("city","").lower()
        name    = info.get("name","").lower()
        cc      = info.get("country","")
        country = COUNTRY_NAMES.get(cc, cc).lower()
        score = 0
        if q == code.lower():          score = 100
        elif city.startswith(q):       score = 85
        elif q in city:                score = 70
        elif name.startswith(q):       score = 60
        elif q in name:                score = 50
        elif country.startswith(q):    score = 40
        elif q in country:             score = 25
        if score:
            results.append({
                "code": code, "city": info.get("city",""),
                "name": info.get("name",""),
                "country": COUNTRY_NAMES.get(cc, cc), "score": score,
            })
    results.sort(key=lambda x: -x["score"])
    return results[:max_results]

@st.cache_data
def _origin_opts():
    pairs = sorted(
        [(iata, f"{iata} — {info['city']}")
         for iata, info in AIRPORTS_DB.items() if info.get("city")],
        key=lambda x: x[0],
    )
    codes  = [p[0] for p in pairs]
    labels = {p[0]: p[1] for p in pairs}
    return codes, labels

def ai_destination_search(query, anthropic_key):
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=anthropic_key)
        prompt = f"""You are a flight destination assistant for Indian travellers flying from Delhi.
The user said: "{query}"

Return ONLY a valid JSON array of up to 8 IATA airport codes that best match what they want.
Consider vibe words like "beaches", "mountains", "party", "budget", "luxury", "history", "adventure".
Consider regions like "Southeast Asia", "Europe", "Middle East", "South Asia".
Example output: ["BKK","HKT","DPS","SIN","KUL"]
Return ONLY the JSON array — no explanation, no markdown."""
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role":"user","content":prompt}]
        )
        codes = json.loads(resp.content[0].text.strip())
        return [c for c in codes if c in AIRPORTS_DB]
    except Exception as e:
        return None, str(e)

def transcribe(audio_data):
    try:
        recognizer = sr.Recognizer()
        audio = sr.AudioData(
            audio_data["bytes"],
            audio_data["sample_rate"],
            audio_data["sample_width"]
        )
        return recognizer.recognize_google(audio)
    except Exception:
        return ""

# ── DESTINATION HIERARCHY ─────────────────────────────────────
# Continent → Country/Region → { top, airports: {IATA: label} }
DESTINATIONS = {
    "🌏 Southeast Asia": {
        "🇹🇭 Thailand": {
            "top": True,
            "airports": {
                "BKK": "Bangkok · Suvarnabhumi",
                "DMK": "Bangkok · Don Mueang",
                "HKT": "Phuket",
                "CNX": "Chiang Mai",
                "KBV": "Krabi",
                "USM": "Koh Samui",
            },
        },
        "🇻🇳 Vietnam": {
            "top": True,
            "airports": {
                "SGN": "Ho Chi Minh City",
                "HAN": "Hanoi",
                "DAD": "Da Nang",
                "PQC": "Phu Quoc",
            },
        },
        "🇸🇬 Singapore": {
            "top": True,
            "airports": {"SIN": "Singapore · Changi"},
        },
        "🇲🇾 Malaysia": {
            "top": True,
            "airports": {
                "KUL": "Kuala Lumpur · KLIA",
                "LGK": "Langkawi",
                "PEN": "Penang",
                "BKI": "Kota Kinabalu",
            },
        },
        "🇮🇩 Indonesia": {
            "top": True,
            "airports": {
                "DPS": "Bali · Denpasar",
                "CGK": "Jakarta",
                "LOP": "Lombok",
            },
        },
        "🇵🇭 Philippines": {
            "top": False,
            "airports": {
                "MNL": "Manila",
                "CEB": "Cebu",
                "KLO": "Kalibo (Boracay)",
            },
        },
        "🇰🇭 Cambodia": {
            "top": False,
            "airports": {
                "PNH": "Phnom Penh",
                "REP": "Siem Reap",
            },
        },
        "🇱🇦 Laos": {
            "top": False,
            "airports": {
                "VTE": "Vientiane",
                "LPQ": "Luang Prabang",
            },
        },
        "🇲🇲 Myanmar": {
            "top": False,
            "airports": {
                "RGN": "Yangon",
                "MDL": "Mandalay",
            },
        },
    },
    "🕌 Middle East & Gulf": {
        "🇦🇪 UAE": {
            "top": True,
            "airports": {
                "DXB": "Dubai · International",
                "AUH": "Abu Dhabi",
                "SHJ": "Sharjah",
            },
        },
        "🇶🇦 Qatar": {
            "top": True,
            "airports": {"DOH": "Doha · Hamad"},
        },
        "🇸🇦 Saudi Arabia": {
            "top": False,
            "airports": {
                "RUH": "Riyadh · King Khalid",
                "JED": "Jeddah",
                "MED": "Madinah",
            },
        },
        "🇴🇲 Oman": {
            "top": False,
            "airports": {
                "MCT": "Muscat",
                "SLL": "Salalah",
            },
        },
        "🇧🇭 Bahrain": {
            "top": False,
            "airports": {"BAH": "Bahrain"},
        },
        "🇰🇼 Kuwait": {
            "top": False,
            "airports": {"KWI": "Kuwait City"},
        },
        "🇯🇴 Jordan": {
            "top": False,
            "airports": {"AMM": "Amman · Queen Alia"},
        },
    },
    "🌊 South Asia & Indian Ocean": {
        "🇲🇻 Maldives": {
            "top": True,
            "airports": {"MLE": "Malé · Velana"},
        },
        "🇲🇺 Mauritius": {
            "top": True,
            "airports": {"MRU": "Port Louis"},
        },
        "🇱🇰 Sri Lanka": {
            "top": True,
            "airports": {"CMB": "Colombo · Bandaranaike"},
        },
        "🇳🇵 Nepal": {
            "top": True,
            "airports": {
                "KTM": "Kathmandu",
                "PKR": "Pokhara",
            },
        },
        "🇧🇹 Bhutan": {
            "top": False,
            "airports": {"PBH": "Paro"},
        },
        "🇧🇩 Bangladesh": {
            "top": False,
            "airports": {
                "DAC": "Dhaka",
                "CGP": "Chittagong",
            },
        },
    },
    "🏯 East Asia": {
        "🇯🇵 Japan": {
            "top": True,
            "airports": {
                "NRT": "Tokyo · Narita",
                "HND": "Tokyo · Haneda",
                "KIX": "Osaka · Kansai",
                "ITM": "Osaka · Itami",
                "CTS": "Sapporo",
                "OKA": "Okinawa · Naha",
            },
        },
        "🇰🇷 South Korea": {
            "top": True,
            "airports": {
                "ICN": "Seoul · Incheon",
                "GMP": "Seoul · Gimpo",
                "PUS": "Busan",
            },
        },
        "🇭🇰 Hong Kong": {
            "top": True,
            "airports": {"HKG": "Hong Kong"},
        },
        "🇨🇳 China": {
            "top": False,
            "airports": {
                "PEK": "Beijing · Capital",
                "PKX": "Beijing · Daxing",
                "PVG": "Shanghai · Pudong",
                "SHA": "Shanghai · Hongqiao",
                "CAN": "Guangzhou",
                "CTU": "Chengdu",
            },
        },
        "🇹🇼 Taiwan": {
            "top": False,
            "airports": {
                "TPE": "Taipei · Taoyuan",
                "TSA": "Taipei · Songshan",
            },
        },
        "🇲🇴 Macau": {
            "top": False,
            "airports": {"MFM": "Macau"},
        },
    },
    "🏰 Europe": {
        "🇬🇧 United Kingdom": {
            "top": True,
            "airports": {
                "LHR": "London · Heathrow",
                "LGW": "London · Gatwick",
                "MAN": "Manchester",
                "BHX": "Birmingham",
                "EDI": "Edinburgh",
            },
        },
        "🇫🇷 France": {
            "top": True,
            "airports": {
                "CDG": "Paris · Charles de Gaulle",
                "ORY": "Paris · Orly",
                "NCE": "Nice",
                "LYS": "Lyon",
            },
        },
        "🇩🇪 Germany": {
            "top": True,
            "airports": {
                "FRA": "Frankfurt",
                "MUC": "Munich",
                "BER": "Berlin · Brandenburg",
                "DUS": "Düsseldorf",
            },
        },
        "🇮🇹 Italy": {
            "top": True,
            "airports": {
                "FCO": "Rome · Fiumicino",
                "MXP": "Milan · Malpensa",
                "VCE": "Venice",
                "NAP": "Naples",
                "FLR": "Florence",
            },
        },
        "🇪🇸 Spain": {
            "top": True,
            "airports": {
                "MAD": "Madrid · Barajas",
                "BCN": "Barcelona",
                "AGP": "Málaga",
                "PMI": "Palma de Mallorca",
            },
        },
        "🇹🇷 Turkey": {
            "top": True,
            "airports": {
                "IST": "Istanbul · Int'l",
                "SAW": "Istanbul · Sabiha",
                "AYT": "Antalya",
                "ADB": "İzmir",
                "DLM": "Dalaman",
            },
        },
        "🇬🇷 Greece": {
            "top": True,
            "airports": {
                "ATH": "Athens",
                "JTR": "Santorini",
                "HER": "Heraklion · Crete",
                "CFU": "Corfu",
                "JMK": "Mykonos",
            },
        },
        "🇵🇹 Portugal": {
            "top": False,
            "airports": {
                "LIS": "Lisbon",
                "OPO": "Porto",
                "FAO": "Faro (Algarve)",
            },
        },
        "🇨🇭 Switzerland": {
            "top": False,
            "airports": {
                "ZRH": "Zurich",
                "GVA": "Geneva",
            },
        },
        "🇳🇱 Netherlands": {
            "top": False,
            "airports": {"AMS": "Amsterdam · Schiphol"},
        },
        "🇦🇹 Austria": {
            "top": False,
            "airports": {"VIE": "Vienna"},
        },
        "🇨🇿 Czech Republic": {
            "top": False,
            "airports": {"PRG": "Prague"},
        },
        "🇭🇺 Hungary": {
            "top": False,
            "airports": {"BUD": "Budapest"},
        },
        "🇸🇪 Sweden": {
            "top": False,
            "airports": {"ARN": "Stockholm · Arlanda"},
        },
        "🇩🇰 Denmark": {
            "top": False,
            "airports": {"CPH": "Copenhagen"},
        },
        "🇫🇮 Finland": {
            "top": False,
            "airports": {"HEL": "Helsinki"},
        },
        "🇵🇱 Poland": {
            "top": False,
            "airports": {
                "WAW": "Warsaw · Chopin",
                "KRK": "Kraków",
            },
        },
    },
    "🌍 Africa": {
        "🇪🇬 Egypt": {
            "top": True,
            "airports": {
                "CAI": "Cairo",
                "HRG": "Hurghada",
                "SSH": "Sharm el-Sheikh",
            },
        },
        "🇰🇪 Kenya": {
            "top": True,
            "airports": {"NBO": "Nairobi · JKIA"},
        },
        "🇿🇦 South Africa": {
            "top": True,
            "airports": {
                "JNB": "Johannesburg",
                "CPT": "Cape Town",
                "DUR": "Durban",
            },
        },
        "🇲🇦 Morocco": {
            "top": False,
            "airports": {
                "CMN": "Casablanca",
                "RAK": "Marrakech",
                "FEZ": "Fes",
            },
        },
        "🇹🇿 Tanzania": {
            "top": False,
            "airports": {
                "DAR": "Dar es Salaam",
                "ZNZ": "Zanzibar",
            },
        },
        "🇪🇹 Ethiopia": {
            "top": False,
            "airports": {"ADD": "Addis Ababa · Bole"},
        },
    },
    "🗽 Americas": {
        "🇺🇸 USA": {
            "top": True,
            "airports": {
                "JFK": "New York · JFK",
                "EWR": "New York · Newark",
                "LAX": "Los Angeles",
                "SFO": "San Francisco",
                "ORD": "Chicago · O'Hare",
                "MIA": "Miami",
                "BOS": "Boston",
                "SEA": "Seattle",
            },
        },
        "🇨🇦 Canada": {
            "top": True,
            "airports": {
                "YYZ": "Toronto · Pearson",
                "YVR": "Vancouver",
                "YUL": "Montréal",
                "YYC": "Calgary",
            },
        },
        "🇲🇽 Mexico": {
            "top": False,
            "airports": {
                "MEX": "Mexico City",
                "CUN": "Cancún",
            },
        },
        "🇧🇷 Brazil": {
            "top": False,
            "airports": {
                "GRU": "São Paulo",
                "GIG": "Rio de Janeiro",
            },
        },
    },
    "🦘 Australia & Pacific": {
        "🇦🇺 Australia": {
            "top": True,
            "airports": {
                "SYD": "Sydney",
                "MEL": "Melbourne",
                "BNE": "Brisbane",
                "PER": "Perth",
                "ADL": "Adelaide",
            },
        },
        "🇳🇿 New Zealand": {
            "top": False,
            "airports": {
                "AKL": "Auckland",
                "CHC": "Christchurch",
                "WLG": "Wellington",
            },
        },
        "🇫🇯 Fiji": {
            "top": False,
            "airports": {"NAN": "Nadi"},
        },
    },
    "🇮🇳 India (Domestic)": {
        "🏙️ North India": {
            "top": True,
            "airports": {
                "DEL": "Delhi · IGI",
                "ATQ": "Amritsar",
                "IXC": "Chandigarh",
                "LKO": "Lucknow",
                "JAI": "Jaipur",
                "VNS": "Varanasi",
            },
        },
        "🌴 South India": {
            "top": True,
            "airports": {
                "BLR": "Bengaluru",
                "MAA": "Chennai",
                "HYD": "Hyderabad",
                "COK": "Kochi",
                "TRV": "Thiruvananthapuram",
                "IXM": "Madurai",
            },
        },
        "🌊 West India": {
            "top": True,
            "airports": {
                "BOM": "Mumbai",
                "GOI": "Goa",
                "AMD": "Ahmedabad",
                "BDQ": "Vadodara",
                "NAG": "Nagpur",
            },
        },
        "🌿 East India": {
            "top": False,
            "airports": {
                "CCU": "Kolkata",
                "BBI": "Bhubaneswar",
                "GAU": "Guwahati",
                "IXB": "Bagdogra",
                "PAT": "Patna",
            },
        },
        "🏝️ Islands": {
            "top": False,
            "airports": {
                "IXZ": "Port Blair · Andaman",
                "AGX": "Agatti · Lakshadweep",
            },
        },
    },
}
ALL_CODES = {
    code: name
    for countries in DESTINATIONS.values()
    for data in countries.values()
    for code, name in data["airports"].items()
}

# ── SERPAPI CALL ───────────────────────────────────────────────
def search_flight(api_key, origin, dest, dep_date, ret_date, trip_type, adults, cabin):
    params = {
        "engine":"google_flights","departure_id":origin,"arrival_id":dest,
        "outbound_date":dep_date,"type":trip_type,"adults":adults,
        "travel_class":cabin,"currency":"INR","hl":"en","api_key":api_key,
    }
    if trip_type == 1 and ret_date:
        params["return_date"] = ret_date
    try:
        r = requests.get("https://serpapi.com/search", params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            return dest, None, data["error"]
        flights = data.get("best_flights",[]) + data.get("other_flights",[])
        if not flights:
            return dest, None, "no results"
        parsed = []
        for f in flights:
            legs = f.get("flights",[])
            if not legs: continue
            stops   = len(legs) - 1
            info    = AIRPORTS_DB.get(dest, {})
            city    = info.get("city", dest)
            cc      = info.get("country","")
            country = COUNTRY_NAMES.get(cc, cc)
            parsed.append({
                "Destination": f"{city}, {country}",
                "Code":        dest,
                "Airline":     " + ".join({l.get("airline","—") for l in legs}),
                "Price (INR)": f.get("price"),
                "Duration":    f"{f.get('total_duration',0)//60}h {f.get('total_duration',0)%60}m",
                "Total mins":  f.get("total_duration",0),
                "Stops":       "Direct" if stops==0 else f"{stops} stop{'s' if stops>1 else ''}",
                "Departure":   legs[0].get("departure_airport",{}).get("time","—"),
                "Arrival":     legs[-1].get("arrival_airport",{}).get("time","—"),
                "Type":        "Best" if f in data.get("best_flights",[]) else "Other",
            })
        return dest, parsed, None
    except Exception as e:
        return dest, None, str(e)


def flag_emoji(cc: str) -> str:
    if not cc or len(cc) != 2: return "🌍"
    return chr(0x1F1E6 + ord(cc[0]) - ord('A')) + chr(0x1F1E6 + ord(cc[1]) - ord('A'))

def render_flight_card(row: dict, is_best: bool = False) -> str:
    cc    = AIRPORTS_DB.get(row["Code"], {}).get("country", "")
    flag  = flag_emoji(cc)
    price = f"₹{int(row['Price (INR)']):,}"
    badge = '<span class="fc-badge">Best Deal</span>' if is_best else ''
    scls  = "fc-direct" if row["Stops"] == "Direct" else "fc-stop"
    city  = row["Destination"].split(",")[0]
    return f"""<div class="flight-card">
  <div class="fc-left"><span class="fc-flag">{flag}</span>
    <div><div class="fc-city">{city}</div><div class="fc-code">{row["Code"]}</div></div></div>
  <div class="fc-mid"><div class="fc-airline">{row["Airline"]}</div>
    <div class="fc-times"><span>{row["Departure"]}</span><span class="fc-arr">→</span><span>{row["Arrival"]}</span></div>
    <div class="fc-meta"><span class="fc-dur">{row["Duration"]}</span> <span class="{scls}">{row["Stops"]}</span></div></div>
  <div class="fc-right">{badge}<div class="fc-price">{price}</div><div class="fc-ftype">{row["Type"]}</div></div>
</div>"""

# ═══════════════════════════════════════════════════════════════
#  STREAMLIT UI
# ═══════════════════════════════════════════════════════════════
st.set_page_config(page_title="Flight Explorer", page_icon="✈️", layout="wide")

# ── MODERN CSS ─────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.stApp {
    background: linear-gradient(135deg, #0A0F1E 0%, #0d1829 50%, #0A0F1E 100%) !important;
}
.main .block-container {
    padding: 1.5rem 2.5rem 4rem !important;
    max-width: 1440px !important;
}

/* ── Topbar card ─────────────────────────────────────────────── */
.topbar-card {
    background: rgba(17,24,39,0.95);
    border: 1px solid rgba(37,99,235,0.15);
    border-radius: 16px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.25rem;
    backdrop-filter: blur(12px);
}

/* ── Typography ──────────────────────────────────────────────── */
h1, h2, h3, h4 { color: #f1f5f9 !important; font-family: 'Inter', sans-serif !important; }
p { font-family: 'Inter', sans-serif !important; }
.stCaption p, [data-testid="stCaptionContainer"] p { color: #475569 !important; font-size: 0.78rem !important; }

/* ── Inputs ──────────────────────────────────────────────────── */
input,
.stTextInput input,
.stNumberInput input,
div[data-baseweb="input"] input {
    background: rgba(4,9,20,0.9) !important;
    border-color: rgba(37,99,235,0.2) !important;
    color: #e2e8f0 !important;
    border-radius: 10px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 0.875rem !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
}
input:focus { border-color: rgba(37,99,235,0.55) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important; outline: none !important; }
input::placeholder { color: #334155 !important; }

/* ── Selectbox ───────────────────────────────────────────────── */
div[data-baseweb="select"] > div:first-child {
    background: rgba(4,9,20,0.9) !important;
    border-color: rgba(37,99,235,0.2) !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
    font-family: 'Inter', sans-serif !important;
}
div[data-baseweb="menu"] {
    background: #111827 !important;
    border: 1px solid rgba(37,99,235,0.18) !important;
    border-radius: 10px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
}
div[data-baseweb="option"] { background: transparent !important; color: #cbd5e1 !important; font-size: 0.875rem !important; }
div[data-baseweb="option"]:hover { background: rgba(37,99,235,0.12) !important; color: #e2e8f0 !important; }

/* ── Date input ──────────────────────────────────────────────── */
.stDateInput input {
    background: rgba(4,9,20,0.9) !important;
    border-color: rgba(37,99,235,0.2) !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
}

/* ── Buttons ─────────────────────────────────────────────────── */
.stButton > button {
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.875rem !important;
    border-radius: 10px !important;
    border: none !important;
    background: linear-gradient(135deg, #2563EB 0%, #6366f1 100%) !important;
    color: white !important;
    padding: 0.55rem 1.25rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 12px rgba(37,99,235,0.25) !important;
    letter-spacing: 0.01em !important;
}
.stButton > button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 24px rgba(37,99,235,0.4) !important;
}
.stButton > button:active { transform: translateY(0) !important; }
.stButton > button:disabled {
    background: rgba(51,65,85,0.4) !important;
    color: #334155 !important;
    box-shadow: none !important;
    transform: none !important;
}

/* ── Download button ─────────────────────────────────────────── */
.stDownloadButton > button {
    background: transparent !important;
    border: 1px solid rgba(37,99,235,0.28) !important;
    color: #93C5FD !important;
    border-radius: 10px !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    transition: all 0.2s ease !important;
    box-shadow: none !important;
}
.stDownloadButton > button:hover {
    background: rgba(37,99,235,0.08) !important;
    border-color: rgba(37,99,235,0.5) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 16px rgba(37,99,235,0.15) !important;
}

/* ── Metric cards ────────────────────────────────────────────── */
[data-testid="metric-container"],
[data-testid="stMetric"] {
    background: rgba(17,24,39,0.85) !important;
    border: 1px solid rgba(37,99,235,0.14) !important;
    border-radius: 16px !important;
    padding: 1.25rem 1.5rem !important;
    backdrop-filter: blur(8px) !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
}
[data-testid="metric-container"]:hover,
[data-testid="stMetric"]:hover {
    border-color: rgba(37,99,235,0.35) !important;
    box-shadow: 0 4px 24px rgba(37,99,235,0.1) !important;
}
[data-testid="stMetricLabel"] p,
[data-testid="stMetricLabel"] div,
[data-testid="stMetricLabel"] span {
    color: #475569 !important;
    font-size: 0.68rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.09em !important;
}
[data-testid="stMetricValue"] > div,
[data-testid="stMetricValue"] {
    color: #93C5FD !important;
    font-size: 1.45rem !important;
    font-weight: 700 !important;
    font-family: 'JetBrains Mono', monospace !important;
    line-height: 1.2 !important;
}

/* ── Tabs ────────────────────────────────────────────────────── */
.stTabs [data-baseweb="tab-list"] {
    background: rgba(4,9,20,0.7) !important;
    border-radius: 14px !important;
    padding: 4px !important;
    gap: 2px !important;
    border: 1px solid rgba(37,99,235,0.08) !important;
    flex-wrap: wrap !important;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    border-radius: 10px !important;
    color: #475569 !important;
    font-weight: 500 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 0.82rem !important;
    border: none !important;
    padding: 0.4rem 0.85rem !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
}
.stTabs [data-baseweb="tab"]:hover {
    color: #94a3b8 !important;
    background: rgba(37,99,235,0.05) !important;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #2563EB 0%, #6366f1 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 10px rgba(37,99,235,0.3) !important;
}
.stTabs [data-baseweb="tab-highlight"],
.stTabs [data-baseweb="tab-border"] { display: none !important; }

/* ── Destination browser — 4-col grid + fixed cards ──────────── */
[data-testid="stTabs"] [data-testid="stHorizontalBlock"]:has([data-testid="stCheckbox"]) {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 8px !important;
    align-items: stretch !important;
}
[data-testid="stTabs"] [data-testid="stHorizontalBlock"]:has([data-testid="stCheckbox"]) > [data-testid="column"] {
    flex: none !important; min-width: 0 !important; width: 100% !important; padding: 0 !important;
}
[data-testid="stTabs"] [data-testid="stCheckbox"] {
    background: rgba(255,255,255,0.02) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 10px !important; padding: 12px 16px !important; margin: 0 !important;
    cursor: pointer !important; transition: all 140ms ease !important;
    display: block !important; width: 100% !important; min-width: 160px !important;
    height: auto !important; box-sizing: border-box !important; overflow: visible !important;
}
[data-testid="stTabs"] [data-testid="stCheckbox"]:hover {
    border-color: rgba(37,99,235,0.4) !important; background: rgba(255,255,255,0.04) !important;
}
[data-testid="stTabs"] [data-testid="stCheckbox"]:has(input:checked) {
    background: linear-gradient(135deg, #2563EB, #1d4ed8) !important;
    border-color: transparent !important;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.55), 0 8px 24px -10px rgba(37,99,235,0.6) !important;
}
[data-testid="stTabs"] [data-testid="stCheckbox"] > div:first-child { display: none !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"] label { cursor: pointer !important; display: block !important; width: 100% !important; overflow: visible !important; white-space: normal !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"] p { margin: 0 !important; line-height: 1.4 !important; white-space: normal !important; overflow: visible !important; text-overflow: unset !important; overflow-wrap: break-word !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"] p:first-child { font-family: 'JetBrains Mono', monospace !important; font-size: 13px !important; font-weight: 700 !important; color: #F9FAFB !important; letter-spacing: 0.03em !important; margin-bottom: 4px !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"] p + p { font-size: 11px !important; color: #9CA3AF !important; font-weight: 400 !important; font-family: 'Inter', sans-serif !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"]:has(input:checked) p { color: #fff !important; }
[data-testid="stTabs"] [data-testid="stCheckbox"]:has(input:checked) p + p { color: rgba(255,255,255,0.78) !important; }

/* ── Hero search input ───────────────────────────────────────── */
[data-testid="stTextInput"]:has(input[placeholder*="Search destinations"]) label { display: none !important; }
[data-testid="stTextInput"]:has(input[placeholder*="Search destinations"]) [data-baseweb="input"] {
    background: rgba(12,19,34,0.95) !important;
    border-radius: 14px !important;
    box-shadow: 0 0 0 1.5px rgba(37,99,235,0.5), 0 22px 60px -32px rgba(99,102,241,0.35) !important;
    border: none !important;
    padding: 6px 18px !important;
}
[data-testid="stTextInput"]:has(input[placeholder*="Search destinations"]) [data-baseweb="input"]:focus-within {
    box-shadow: 0 0 0 2px rgba(37,99,235,0.7), 0 0 0 4px rgba(37,99,235,0.12), 0 22px 60px -32px rgba(99,102,241,0.5) !important;
}
[data-testid="stTextInput"]:has(input[placeholder*="Search destinations"]) input {
    font-size: 15px !important; padding: 12px 4px !important;
    background: transparent !important; border: none !important; box-shadow: none !important;
    color: #F9FAFB !important;
}
[data-testid="stTextInput"]:has(input[placeholder*="Search destinations"]) input::placeholder {
    color: #4B5563 !important; font-size: 15px !important;
}

/* ── Selection bar ───────────────────────────────────────────── */
.sel-bar {
    border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;
    padding: 12px 16px; background: rgba(17,24,39,0.6);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    gap: 8px; flex-wrap: wrap; margin: 0.75rem 0;
}
.sel-bar-label {
    font-size: 10.5px; color: #4B5563; text-transform: uppercase;
    letter-spacing: 0.1em; font-weight: 700; margin-right: 4px; white-space: nowrap;
}
.sel-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px;
    background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.4);
    color: #dbe5ff; font-size: 12px; font-weight: 500;
}
.sel-bar-empty { color: #4B5563; font-size: 12.5px; }

/* ── Suggestion chips ────────────────────────────────────────── */
.suggestion-chips {
    display: flex; flex-wrap: wrap; gap: 6px; margin: -2px 0 10px; align-items: center;
}
.sc-label {
    font-size: 10.5px; color: #374151; text-transform: uppercase;
    letter-spacing: 0.1em; font-weight: 700;
}
.sc-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; font-size: 11.5px; font-weight: 500;
    border-radius: 999px; border: 1px solid rgba(255,255,255,0.07);
    background: transparent; color: #9CA3AF;
}
.sc-code { color: #F9FAFB; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

/* ── Search button hero ──────────────────────────────────────── */
[data-testid="stBaseButton-primary"]:has(+ *) {
    height: 52px !important; font-size: 14px !important; border-radius: 14px !important;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.45), 0 22px 50px -22px rgba(37,99,235,0.7) !important;
    letter-spacing: 0.01em !important;
}

/* ── Plain checkboxes outside tabs ──────────────────────────── */
.stCheckbox label span { color: #94a3b8 !important; font-size: 0.875rem !important; }
.stCheckbox label span strong { color: #e2e8f0 !important; }

/* ── Radio ───────────────────────────────────────────────────── */
.stRadio > div > label span { color: #94a3b8 !important; font-size: 0.85rem !important; }

/* ── Toggle ──────────────────────────────────────────────────── */
[data-testid="stToggle"] label p,
[data-testid="stToggle"] label span { color: #94a3b8 !important; font-size: 0.85rem !important; }

/* ── Slider ──────────────────────────────────────────────────── */
[data-testid="stSlider"] label p { color: #64748b !important; font-size: 0.82rem !important; }
[data-testid="stSlider"] [data-testid="stTickBarMin"],
[data-testid="stSlider"] [data-testid="stTickBarMax"] { color: #334155 !important; font-size: 0.72rem !important; }
[data-testid="stSlider"] [data-testid="stThumbValue"] { color: #93C5FD !important; font-weight: 600 !important; font-size: 0.8rem !important; }

/* ── Alerts ──────────────────────────────────────────────────── */
div.stAlert { border-radius: 12px !important; font-size: 0.875rem !important; }
div[data-testid="stInfo"]    { background: rgba(37,99,235,0.07) !important; border-left-color: #2563EB !important; color: #93C5FD !important; }
div[data-testid="stWarning"] { background: rgba(245,158,11,0.07) !important; border-left-color: #f59e0b !important; color: #fde68a !important; }
div[data-testid="stSuccess"] { background: rgba(16,185,129,0.07) !important; border-left-color: #10b981 !important; color: #6ee7b7 !important; }
div[data-testid="stError"]   { background: rgba(239,68,68,0.07) !important;  border-left-color: #ef4444 !important; color: #fca5a5 !important; }

/* ── Divider ─────────────────────────────────────────────────── */
hr { border: none !important; border-top: 1px solid rgba(37,99,235,0.08) !important; margin: 1.25rem 0 !important; }

/* ── Plotly chart ────────────────────────────────────────────── */
[data-testid="stPlotlyChart"] {
    border-radius: 16px !important;
    overflow: hidden !important;
    border: 1px solid rgba(37,99,235,0.12) !important;
}

/* ── Expander ────────────────────────────────────────────────── */
details, .stExpander {
    border: 1px solid rgba(37,99,235,0.1) !important;
    border-radius: 12px !important;
    background: rgba(17,24,39,0.6) !important;
    overflow: hidden !important;
}
.stExpander summary { color: #64748b !important; font-size: 0.85rem !important; }

/* ── Progress bar ────────────────────────────────────────────── */
.stProgress > div > div > div > div {
    background: linear-gradient(90deg, #2563EB 0%, #6366f1 100%) !important;
    border-radius: 4px !important;
}

/* ── Number input ────────────────────────────────────────────── */
.stNumberInput button {
    background: rgba(37,99,235,0.08) !important;
    border-color: rgba(37,99,235,0.2) !important;
    color: #93C5FD !important;
    border-radius: 6px !important;
}

/* ── Flight cards ────────────────────────────────────────────── */
.cards-grid { display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.75rem; }
.flight-card {
    display: flex; align-items: center; gap: 1.5rem;
    background: rgba(17,24,39,0.85);
    border: 1px solid rgba(37,99,235,0.12);
    border-radius: 14px; padding: 1rem 1.25rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.flight-card:hover { border-color: rgba(37,99,235,0.38); box-shadow: 0 4px 24px rgba(37,99,235,0.09); }
.fc-left  { display:flex; align-items:center; gap:0.75rem; min-width:140px; }
.fc-flag  { font-size:1.6rem; line-height:1; }
.fc-city  { color:#F9FAFB; font-weight:600; font-size:0.9rem; }
.fc-code  { color:#6B7280; font-size:0.72rem; font-family:'JetBrains Mono',monospace; }
.fc-mid   { flex:1; display:flex; flex-direction:column; gap:0.25rem; }
.fc-airline { color:#9CA3AF; font-size:0.78rem; }
.fc-times { color:#E5E7EB; font-size:0.88rem; font-family:'JetBrains Mono',monospace; display:flex; align-items:center; gap:0.5rem; }
.fc-arr   { color:#4B5563; }
.fc-meta  { display:flex; gap:0.6rem; align-items:center; }
.fc-dur   { color:#6B7280; font-size:0.74rem; }
.fc-direct{ background:rgba(16,185,129,0.12); color:#34D399; border:1px solid rgba(16,185,129,0.25); border-radius:20px; padding:0.1rem 0.5rem; font-size:0.7rem; font-weight:600; }
.fc-stop  { background:rgba(37,99,235,0.12); color:#93C5FD; border:1px solid rgba(37,99,235,0.25); border-radius:20px; padding:0.1rem 0.5rem; font-size:0.7rem; font-weight:600; }
.fc-right { text-align:right; min-width:120px; }
.fc-price { color:#F9FAFB; font-size:1.25rem; font-weight:700; font-family:'JetBrains Mono',monospace; }
.fc-ftype { color:#4B5563; font-size:0.7rem; margin-top:0.15rem; }
.fc-badge { display:inline-block; background:rgba(16,185,129,0.15); color:#10B981; border:1px solid rgba(16,185,129,0.3); border-radius:20px; padding:0.1rem 0.55rem; font-size:0.68rem; font-weight:600; margin-bottom:0.35rem; }

/* ── Scrollbar ───────────────────────────────────────────────── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: rgba(4,9,20,0.4); }
::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.38); }

/* ── Hide Streamlit chrome ───────────────────────────────────── */
[data-testid="stHeader"],
[data-testid="stToolbar"],
[data-testid="stDecoration"],
[data-testid="stAppDeployButton"],
footer { display: none !important; }
.main .block-container { padding-top: 0.5rem !important; }

/* ── Topbar nav block ────────────────────────────────────────── */
.topbar-nav-block {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(180deg, rgba(17,24,39,0.98), rgba(10,15,30,0.95));
    border: 1px solid rgba(255,255,255,0.07); border-bottom: none;
    border-radius: 16px 16px 0 0; padding: 9px 22px;
}

/* ── Seamless topbar: pull form row up to close the Streamlit gap ── */
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) {
    margin-top: -1rem !important;
}
</style>
""", unsafe_allow_html=True)

# ── EARLY: build selected_codes from session state ─────────────
def get_selected_codes():
    codes = set(st.session_state.get("smart_selected", set()))
    for k, v in st.session_state.items():
        if k.startswith("dest_") and v:
            codes.add(k[5:])
    return codes

selected_codes = get_selected_codes()

# ── URL PARAM HANDLING (results open in new tab) ───────────────
_qp = st.query_params
_is_autorun = _qp.get('autorun') == '1'

if _is_autorun and not st.session_state.get('_url_loaded'):
    if _qp.get('origin'):
        st.session_state['tb_origin'] = _qp['origin']
    if _qp.get('dep'):
        try:
            st.session_state['tb_dep'] = datetime.strptime(_qp['dep'], '%Y-%m-%d').date()
        except ValueError:
            pass
    if _qp.get('ret'):
        try:
            st.session_state['tb_ret'] = datetime.strptime(_qp['ret'], '%Y-%m-%d').date()
        except ValueError:
            pass
    if _qp.get('trip'):
        st.session_state['tb_trip'] = 'Round-trip' if _qp['trip'] == '1' else 'One-way'
    if _qp.get('adults'):
        st.session_state['tb_adults'] = int(_qp['adults'])
    if _qp.get('cabin'):
        st.session_state['tb_cabin'] = int(_qp['cabin'])
    for _uc in _qp.get('dests', '').split(','):
        if _uc.strip():
            st.session_state[f'dest_{_uc.strip()}'] = True
    st.session_state['_url_loaded'] = True
    selected_codes = get_selected_codes()

# ── API KEYS (configure via Settings page) ─────────────────────
api_key       = SERPAPI_KEY
anthropic_key = ANTHROPIC_KEY

# ── TOPBAR CSS: scope to config row via :has() ─────────────────
st.markdown("""
<style>
.cell-hdr{display:flex;align-items:center;gap:6px;margin-bottom:5px;}
.cell-ico{width:22px;height:22px;border-radius:5px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;line-height:1;}
.cell-lbl{font-size:9px;color:#4B5563;text-transform:uppercase;letter-spacing:0.13em;font-weight:700;}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]){
    background:linear-gradient(180deg,rgba(14,20,36,0.97),rgba(10,15,30,0.95));
    border:1px solid rgba(255,255,255,0.07);
    border-top:none;
    border-radius:0 0 16px 16px;
    overflow:hidden;
    padding:0 !important;
    margin-bottom:1.25rem;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) [data-testid="column"]{
    padding:12px 16px !important;
    border-right:1px solid rgba(255,255,255,0.05) !important;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) [data-testid="column"]:last-of-type{
    border-right:none !important;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) input{
    font-size:14px !important;
    font-weight:700 !important;
    color:#F9FAFB !important;
    background:transparent !important;
    border:none !important;
    border-bottom:1px solid rgba(255,255,255,0.07) !important;
    border-radius:0 !important;
    padding:2px 0 5px !important;
    letter-spacing:-0.01em !important;
    box-shadow:none !important;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) input:focus{
    border-bottom-color:rgba(37,99,235,0.55) !important;
    box-shadow:none !important;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) [data-baseweb="select"] > div:first-child{
    border:none !important;
    border-bottom:1px solid rgba(255,255,255,0.07) !important;
    border-radius:0 !important;
    background:transparent !important;
    font-size:14px !important;
    font-weight:700 !important;
    color:#F9FAFB !important;
    padding-left:0 !important;
    box-shadow:none !important;
}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) .stRadio > div{gap:6px !important;}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) .stRadio label span{font-size:12px !important;color:#9CA3AF !important;}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) .stNumberInput input{font-size:14px !important;font-weight:700 !important;}
[data-testid="stHorizontalBlock"]:has([aria-label="From (IATA)"]) .stNumberInput button{background:rgba(255,255,255,0.04) !important;border:1px solid rgba(255,255,255,0.08) !important;color:#93C5FD !important;}
.nav-pill{font-size:12px;color:#6B7280;padding:5px 10px;border-radius:6px;text-align:center;white-space:nowrap;cursor:default;transition:all 0.15s ease;}
.nav-pill a,.nav-pill a:visited{color:#6B7280;text-decoration:none;}
.nav-pill:hover{color:#9CA3AF;background:rgba(255,255,255,0.04);}
.nav-active{font-weight:500;color:#F9FAFB !important;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);}
a.nav-pill{cursor:pointer;}
a.nav-pill:hover{color:#9CA3AF;background:rgba(255,255,255,0.05);}
</style>
""", unsafe_allow_html=True)

# ── TOPBAR: single nav block (no Streamlit columns — avoids gap issues) ─
st.markdown(
    '<div class="topbar-nav-block">'
    '<div style="display:flex;align-items:center;gap:9px;font-weight:700;font-size:14px;color:#F9FAFB;letter-spacing:-0.01em;">'
    '<div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#2563EB,#6366F1);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 0 1px rgba(255,255,255,0.1),0 6px 18px -8px rgba(99,102,241,0.7);flex-shrink:0;">✈</div>'
    'FlightDesk'
    '<span style="font-size:9px;color:#374151;font-weight:500;letter-spacing:0.14em;margin-left:7px;">v2</span>'
    '</div>'
    '<div style="display:flex;align-items:center;gap:2px;">'
    '<div class="nav-pill nav-active">Search</div>'
    '<div class="nav-pill">Watchlist</div>'
    '<div class="nav-pill">History</div>'
    '<a class="nav-pill" href="/Settings" target="_blank" style="text-decoration:none;">⚙ Settings</a>'
    '</div>'
    '<div style="display:flex;align-items:center;gap:7px;">'
    '<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:10.5px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.025);color:#6B7280;">'
    '<span style="width:5px;height:5px;border-radius:50%;background:#10B981;display:inline-block;flex-shrink:0;"></span>SerpAPI · live</div>'
    '<div style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:10.5px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.025);color:#6B7280;">INR · ₹</div>'
    '<div style="width:27px;height:27px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#2563EB);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;">DS</div>'
    '</div>'
    '</div>',
    unsafe_allow_html=True
)

tc1, tc2, tc3, tc4, tc5, tc6 = st.columns([1.0, 1.4, 1.2, 1.2, 0.85, 1.25])

with tc1:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">📍</div><span class="cell-lbl">From</span></div>', unsafe_allow_html=True)
    _oc, _ol = _origin_opts()
    _oc_default = st.session_state.get("tb_origin", "DEL")
    _oc_idx = _oc.index(_oc_default) if _oc_default in _oc else (_oc.index("DEL") if "DEL" in _oc else 0)
    origin = st.selectbox(
        "From (IATA)",
        options=_oc,
        index=_oc_idx,
        format_func=lambda x: _ol.get(x, x),
        key="tb_origin",
        label_visibility="collapsed",
    )

with tc2:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">🗓</div><span class="cell-lbl">Depart</span></div>', unsafe_allow_html=True)
    dep_date = st.date_input("Depart date", value=date.today()+timedelta(days=21),
                             min_value=date.today(), key="tb_dep", label_visibility="collapsed")

with tc3:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">↩</div><span class="cell-lbl">Trip type</span></div>', unsafe_allow_html=True)
    trip_type_label = st.radio("Trip type", ["Round-trip", "One-way"],
                               horizontal=True, key="tb_trip", label_visibility="collapsed")
    trip_type = 1 if trip_type_label == "Round-trip" else 2

with tc4:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">🗓</div><span class="cell-lbl">Return</span></div>', unsafe_allow_html=True)
    if trip_type == 1:
        ret_date = st.date_input("Return date", value=dep_date+timedelta(days=7),
                                 min_value=dep_date, key="tb_ret", label_visibility="collapsed")
    else:
        ret_date = None
        st.caption("One-way")

with tc5:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">👤</div><span class="cell-lbl">Adults</span></div>', unsafe_allow_html=True)
    adults = st.number_input("Adults count", min_value=1, max_value=9, value=1,
                             key="tb_adults", label_visibility="collapsed")

with tc6:
    st.markdown('<div class="cell-hdr"><div class="cell-ico">💺</div><span class="cell-lbl">Cabin</span></div>', unsafe_allow_html=True)
    cabin = st.selectbox("Cabin class", options=[1,2,3,4], key="tb_cabin",
                         label_visibility="collapsed",
                         format_func=lambda x:{1:"Economy",2:"Premium eco",3:"Business",4:"First"}[x])

# ── HERO SEARCH ──────────────────────────────────────────────────
_hsearch_col, _voice_col = st.columns([11, 1])

with _hsearch_col:
    smart_query = st.text_input(
        "Hero search",
        placeholder="Search destinations, cities, or describe your trip…",
        label_visibility="collapsed",
        key="smart_query_input"
    )

with _voice_col:
    if VOICE_OK:
        audio = mic_recorder(
            start_prompt="🎤", stop_prompt="⏹",
            just_once=True, use_container_width=True, key="voice_rec"
        )
        if audio and audio.get("bytes"):
            transcript = transcribe(audio)
            if transcript:
                st.session_state["smart_query_input"] = transcript
                smart_query = transcript
                st.info(f'Heard: "{transcript}"')
    else:
        st.button("🎤", disabled=True, help="Install streamlit-mic-recorder & SpeechRecognition")

# ── SEARCH LOGIC ─────────────────────────────────────────────────
search_results = []
if smart_query and len(smart_query.strip()) >= 2:
    use_ai = anthropic_key and len(smart_query.split()) > 1
    if use_ai:
        with st.spinner("Asking AI for destinations…"):
            ai_codes = ai_destination_search(smart_query, anthropic_key)
        if ai_codes and isinstance(ai_codes, list):
            search_results = [
                {"code":c, "city":AIRPORTS_DB.get(c,{}).get("city",c),
                 "name":AIRPORTS_DB.get(c,{}).get("name",""),
                 "country":COUNTRY_NAMES.get(AIRPORTS_DB.get(c,{}).get("country",""),""),
                 "score":99}
                for c in ai_codes
            ]
            st.caption("🤖 AI-powered results")
        else:
            search_results = fuzzy_search(smart_query)
            st.caption("Fuzzy search results (AI unavailable)")
    else:
        search_results = fuzzy_search(smart_query)
        if not anthropic_key:
            st.caption("Fuzzy results — add Anthropic key for AI-powered vibe search")

if "smart_selected" not in st.session_state:
    st.session_state.smart_selected = set()

# Suggestion chips + hidden toggle checkboxes
if search_results:
    _chips_html = '<div class="suggestion-chips"><span class="sc-label">Matches</span>'
    for _r in search_results[:8]:
        _chips_html += (
            f'<span class="sc-chip">'
            f'<span class="sc-code">{_r["code"]}</span>'
            f' {_r["city"]}'
            f'</span>'
        )
    _chips_html += '</div>'
    st.markdown(_chips_html, unsafe_allow_html=True)
    _scols = st.columns(min(len(search_results), 8))
    for _si, _sr in enumerate(search_results[:8]):
        _scode = _sr["code"]
        with _scols[_si]:
            _schecked = st.checkbox(
                _scode, key=f"smart_{_scode}",
                value=_scode in st.session_state.smart_selected,
                label_visibility="collapsed"
            )
            if _schecked: st.session_state.smart_selected.add(_scode)
            else: st.session_state.smart_selected.discard(_scode)

# ── SELECTION BAR (QUERYING) ──────────────────────────────────────
selected_codes = get_selected_codes()

if selected_codes:
    _pills_html = ""
    for _c in sorted(selected_codes):
        _cc = AIRPORTS_DB.get(_c, {}).get("country", "")
        _flag = flag_emoji(_cc) if _cc else "🏳"
        _pills_html += (
            f'<span class="sel-pill">'
            f'<span style="font-size:14px;line-height:1;">{_flag}</span>'
            f'<span style="font-family:JetBrains Mono,monospace;font-weight:600;">{_c}</span>'
            f'</span>'
        )
    _sel_bar_html = (
        f'<div class="sel-bar">'
        f'<span class="sel-bar-label">Querying</span>'
        f'{_pills_html}'
        f'</div>'
    )
else:
    _sel_bar_html = (
        '<div class="sel-bar sel-bar-empty">'
        '<span style="display:inline-flex;width:6px;height:6px;border-radius:50%;'
        'background:#374151;margin-right:10px;flex-shrink:0;"></span>'
        'Type codes or pick airports below to begin'
        '</div>'
    )

_sbar_col, _entry_col, _clr_col = st.columns([5, 4, 1])

with _sbar_col:
    st.markdown(_sel_bar_html, unsafe_allow_html=True)

with _entry_col:
    _oc, _ol = _origin_opts()
    _add_opts = [None] + _oc
    _add_key  = f"add_dest_{st.session_state.get('_add_ctr', 0)}"
    _picked = st.selectbox(
        "add_dest_search",
        options=_add_opts,
        format_func=lambda x: "＋ Add airport…" if x is None else (
            f"{x}  ·  {AIRPORTS_DB.get(x, {}).get('city', '')},"
            f" {COUNTRY_NAMES.get(AIRPORTS_DB.get(x, {}).get('country', ''), '')}  —  "
            f"{AIRPORTS_DB.get(x, {}).get('name', '')}"
        ),
        index=0,
        key=_add_key,
        label_visibility="collapsed",
    )
    if _picked is not None:
        st.session_state.smart_selected.add(_picked)
        st.session_state['_add_ctr'] = st.session_state.get('_add_ctr', 0) + 1
        st.rerun()

with _clr_col:
    if st.button("Clear", key="clear_all_dests", use_container_width=True,
                 disabled=not bool(selected_codes)):
        for _k in list(st.session_state.keys()):
            if _k.startswith("dest_") or _k.startswith("smart_"):
                st.session_state[_k] = False
        st.session_state.smart_selected = set()
        st.rerun()

# ── SEARCH BUTTON ────────────────────────────────────────────────
_dest_label = f"  ·  {len(selected_codes)} routes" if selected_codes else ""
_btn_clicked = st.button(
    f"✈  Search Flights{_dest_label}",
    type="primary", use_container_width=True,
    disabled=not (api_key and selected_codes)
)

# ── DESTINATION BROWSER ──────────────────────────────────────────
selected_codes = get_selected_codes()
_browser_label = (
    f"Browse destinations  ·  {len(selected_codes)} selected"
    if selected_codes else "Browse destinations"
)
with st.expander(_browser_label, expanded=False):
    continent_tabs = st.tabs(list(DESTINATIONS.keys()))
    for _ctab, (_continent, _countries) in zip(continent_tabs, DESTINATIONS.items()):
        with _ctab:
            for _country, _data in _countries.items():
                _airports = _data["airports"]
                with st.expander(_country, expanded=False):
                    _codes = list(_airports.keys())
                    _N = 4
                    for _rs in range(0, len(_codes), _N):
                        _chunk = _codes[_rs:_rs + _N]
                        _rcols = st.columns(_N)
                        for _j, _code in enumerate(_chunk):
                            _aname = _airports[_code]
                            with _rcols[_j]:
                                _cur = bool(st.session_state.get(f"dest_{_code}", False))
                                if st.checkbox(
                                    f"**{_code}**\n\n{_aname}",
                                    key=f"dest_{_code}",
                                    value=_cur,
                                    label_visibility="visible"
                                ):
                                    selected_codes.add(_code)

# Open results in a new browser tab
if _btn_clicked:
    _p = {
        'origin': origin,
        'dep':    str(dep_date),
        'trip':   str(trip_type),
        'adults': str(adults),
        'cabin':  str(cabin),
        'dests':  ','.join(sorted(selected_codes)),
        'autorun':'1',
    }
    if ret_date:
        _p['ret'] = str(ret_date)
    _qs = urllib.parse.urlencode(_p)
    components.html(
        f'<script>window.parent.open("?{_qs}","_blank");</script>',
        height=0, scrolling=False,
    )

# Auto-run on the results tab (first load only, when URL has autorun=1)
search_clicked = _is_autorun and ('results' not in st.session_state)

if search_clicked:
    if trip_type == 1 and not ret_date:
        st.error("Pick a return date for round-trip.")
        st.stop()

    progress = st.progress(0, text=f"Searching {len(selected_codes)} destinations…")
    all_rows, errors, done = [], [], 0

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {
            ex.submit(search_flight, api_key, origin, d, str(dep_date),
                      str(ret_date) if ret_date else "", trip_type, adults, cabin): d
            for d in selected_codes
        }
        for fut in as_completed(futures):
            dest, rows, err = fut.result()
            if rows: all_rows.extend(rows)
            if err:  errors.append((dest, err))
            done += 1
            progress.progress(done/len(selected_codes), text=f"Searched {done}/{len(selected_codes)}…")

    progress.empty()
    st.session_state["results"] = all_rows
    st.session_state["errors"]  = errors
    st.session_state["meta"]    = {
        "origin":origin, "dep_date":str(dep_date),
        "ret_date":str(ret_date) if ret_date else "",
        "trip_type":trip_type_label
    }

# ── RESULTS ────────────────────────────────────────────────────
if "results" in st.session_state and st.session_state["results"]:
    df = pd.DataFrame(st.session_state["results"]).dropna(subset=["Price (INR)"])
    st.divider()

    st.markdown("""
<div style="margin: 0.5rem 0 1rem; padding-bottom: 0.65rem; border-bottom: 1px solid rgba(56,189,248,0.07);">
    <h3 style="color:#e2e8f0; font-size:0.95rem; font-weight:600; margin:0; letter-spacing:-0.01em;">
        📊&nbsp; Results
    </h3>
</div>
""", unsafe_allow_html=True)

    fc1, fc2, fc3, fc4 = st.columns([1,1,1,2])
    with fc1: direct_only = st.toggle("Direct only")
    with fc2: best_only   = st.toggle("Best results only")
    with fc3: sort_by     = st.selectbox("Sort by", ["Price (low→high)","Price (high→low)","Duration (shortest)"])
    with fc4: max_price   = st.slider("Max price (INR)", int(df["Price (INR)"].min()), int(df["Price (INR)"].max()), int(df["Price (INR)"].max()))

    filtered = df.copy()
    if direct_only: filtered = filtered[filtered["Stops"]=="Direct"]
    if best_only:   filtered = filtered[filtered["Type"]=="Best"]
    filtered = filtered[filtered["Price (INR)"] <= max_price]

    if sort_by == "Price (low→high)":   filtered = filtered.sort_values("Price (INR)")
    elif sort_by == "Price (high→low)": filtered = filtered.sort_values("Price (INR)", ascending=False)
    else:                               filtered = filtered.sort_values("Total mins")

    cheapest = filtered.loc[filtered["Price (INR)"].idxmin()] if not filtered.empty else None
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Options shown",  len(filtered))
    m2.metric("Cheapest",       f"₹{int(filtered['Price (INR)'].min()):,}" if not filtered.empty else "—")
    m3.metric("Median price",   f"₹{int(filtered['Price (INR)'].median()):,}" if not filtered.empty else "—")
    m4.metric("Best deal to",   cheapest["Destination"] if cheapest is not None else "—")

    st.markdown("<div style='margin-top:1rem;'></div>", unsafe_allow_html=True)

    chart_df = df.loc[df.groupby("Code")["Price (INR)"].idxmin()].sort_values("Price (INR)")
    fig = px.bar(
        chart_df, x="Code", y="Price (INR)", color="Stops",
        hover_data=["Airline","Duration","Destination"],
        title=f"Cheapest fare per destination from {st.session_state['meta']['origin']}",
        color_discrete_map={
            "Direct":  "#10B981",
            "1 stop":  "#2563EB",
            "2 stops": "#6366F1",
            "3 stops": "#F59E0B",
        },
    )
    fig.update_layout(
        height=360,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(8,16,28,0.5)",
        font=dict(family="Inter, sans-serif", color="#64748b", size=11),
        title=dict(font=dict(color="#cbd5e1", size=13, family="Inter"), x=0, pad=dict(l=0, t=0)),
        showlegend=True,
        legend=dict(
            bgcolor="rgba(0,0,0,0)", font=dict(color="#475569", size=11),
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
        ),
        xaxis=dict(
            gridcolor="rgba(37,99,235,0.06)", linecolor="rgba(37,99,235,0.08)",
            tickfont=dict(color="#475569", size=11), title=None,
            zerolinecolor="rgba(37,99,235,0.06)",
        ),
        yaxis=dict(
            gridcolor="rgba(37,99,235,0.06)", linecolor="rgba(37,99,235,0.08)",
            tickfont=dict(color="#475569", size=11), title=None,
            tickprefix="₹", zerolinecolor="rgba(37,99,235,0.06)",
        ),
        bargap=0.28,
        margin=dict(l=5, r=5, t=40, b=5),
    )
    fig.update_traces(marker_line_width=0, opacity=0.88)
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False, "responsive": True})

    display_cols = ["Destination","Code","Airline","Price (INR)","Duration","Stops","Departure","Arrival","Type"]

    # HTML flight cards
    best_codes = set(filtered[filtered["Type"] == "Best"]["Code"].unique()) if not filtered.empty else set()
    cards_html = '<div class="cards-grid">'
    for _, row in filtered.iterrows():
        is_best = row["Code"] in best_codes and row["Type"] == "Best"
        cards_html += render_flight_card(row.to_dict(), is_best)
    cards_html += '</div>'
    st.markdown(cards_html, unsafe_allow_html=True)

    meta = st.session_state["meta"]
    st.download_button(
        "⬇️  Download CSV",
        filtered[display_cols].to_csv(index=False).encode(),
        file_name=f"flights_{meta['origin']}_{meta['dep_date']}.csv",
        mime="text/csv"
    )

    if st.session_state.get("errors"):
        with st.expander(f"⚠️  {len(st.session_state['errors'])} destination(s) with issues"):
            for dest, err in st.session_state["errors"]:
                st.text(f"{dest}: {err}")

elif "results" in st.session_state:
    st.warning("No results came back. Errors:")
    for dest, err in st.session_state.get("errors",[]):
        st.code(f"{dest}: {err}", language=None)
