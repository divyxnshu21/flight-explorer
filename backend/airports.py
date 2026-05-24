import airportsdata

# ── Airport database ──────────────────────────────────────────────────────────

def _load() -> dict:
    raw = airportsdata.load("IATA")
    return {k: v for k, v in raw.items() if k and len(k) == 3 and v.get("city")}

AIRPORTS_DB: dict = _load()

COUNTRY_NAMES: dict[str, str] = {
    "TH": "Thailand",    "VN": "Vietnam",     "ID": "Indonesia",  "MY": "Malaysia",
    "SG": "Singapore",   "KH": "Cambodia",    "LA": "Laos",       "MM": "Myanmar",
    "IN": "India",       "MV": "Maldives",    "LK": "Sri Lanka",  "NP": "Nepal",
    "AE": "UAE",         "OM": "Oman",        "QA": "Qatar",      "BH": "Bahrain",
    "KW": "Kuwait",      "SA": "Saudi Arabia","JO": "Jordan",
    "JP": "Japan",       "KR": "South Korea", "CN": "China",      "HK": "Hong Kong",
    "TW": "Taiwan",      "MO": "Macau",       "PH": "Philippines",
    "AU": "Australia",   "NZ": "New Zealand", "FJ": "Fiji",
    "GB": "UK",          "FR": "France",      "DE": "Germany",    "IT": "Italy",
    "ES": "Spain",       "PT": "Portugal",    "GR": "Greece",     "TR": "Turkey",
    "US": "USA",         "CA": "Canada",      "MX": "Mexico",     "BR": "Brazil",
    "ZA": "South Africa","EG": "Egypt",       "KE": "Kenya",      "MA": "Morocco",
    "TZ": "Tanzania",    "ET": "Ethiopia",
    "NL": "Netherlands", "CH": "Switzerland", "AT": "Austria",    "BE": "Belgium",
    "SE": "Sweden",      "NO": "Norway",      "DK": "Denmark",    "FI": "Finland",
    "PL": "Poland",      "CZ": "Czech Republic","HU": "Hungary",  "MU": "Mauritius",
    "BT": "Bhutan",      "BD": "Bangladesh",
}


def flag_emoji(cc: str) -> str:
    if not cc or len(cc) != 2:
        return "🌍"
    return chr(0x1F1E6 + ord(cc[0]) - ord("A")) + chr(0x1F1E6 + ord(cc[1]) - ord("A"))


def airport_label(code: str) -> str:
    info    = AIRPORTS_DB.get(code, {})
    city    = info.get("city", "")
    country = COUNTRY_NAMES.get(info.get("country", ""), info.get("country", ""))
    name    = info.get("name", "")
    return f"{code} — {city}, {country} ({name})"


def fuzzy_search(query: str, max_results: int = 12) -> list[dict]:
    q = query.lower().strip()
    if not q:
        return []
    results = []
    for code, info in AIRPORTS_DB.items():
        city    = info.get("city", "").lower()
        name    = info.get("name", "").lower()
        cc      = info.get("country", "")
        country = COUNTRY_NAMES.get(cc, cc).lower()
        score = 0
        if q == code.lower():       score = 100
        elif city.startswith(q):    score = 85
        elif q in city:             score = 70
        elif name.startswith(q):    score = 60
        elif q in name:             score = 50
        elif country.startswith(q): score = 40
        elif q in country:          score = 25
        if score:
            results.append({
                "code":    code,
                "city":    info.get("city", ""),
                "name":    info.get("name", ""),
                "country": COUNTRY_NAMES.get(cc, cc),
                "flag":    flag_emoji(cc),
                "score":   score,
            })
    results.sort(key=lambda x: -x["score"])
    return results[:max_results]


def all_airports_list() -> list[dict]:
    """Full list for autocomplete dropdowns, sorted by IATA code."""
    out = []
    for code, info in sorted(AIRPORTS_DB.items()):
        cc = info.get("country", "")
        out.append({
            "code":    code,
            "city":    info.get("city", ""),
            "name":    info.get("name", ""),
            "country": COUNTRY_NAMES.get(cc, cc),
            "flag":    flag_emoji(cc),
        })
    return out
