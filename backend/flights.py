import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from airports import AIRPORTS_DB, COUNTRY_NAMES, flag_emoji


def _parse_baggage(extensions: list) -> dict:
    cabin = None
    checked = None
    for raw in extensions:
        e = raw.lower()
        wm = re.search(r'\((\d+)\s*kg\)', e)
        weight = f"{wm.group(1)} kg" if wm else None
        if 'carry-on' in e or 'cabin bag' in e:
            if 'no carry-on' in e:
                cabin = {'included': False, 'label': 'Not included', 'weight': None}
            else:
                cabin = {'included': True, 'label': weight or 'Included', 'weight': weight}
        elif 'checked bag' in e or 'checked luggage' in e:
            if 'for a fee' in e or 'fee' in e:
                checked = {'included': False, 'label': 'For a fee' + (f' · {weight}' if weight else ''), 'weight': weight}
            elif 'no checked' in e:
                checked = {'included': False, 'label': 'Not included', 'weight': None}
            else:
                checked = {'included': True, 'label': weight or 'Included', 'weight': weight}
    return {'cabin': cabin, 'checked': checked}


def _parse_flight(f: dict, dest: str, best_set: set) -> dict:
    legs    = f.get("flights", [])
    stops   = len(legs) - 1
    info    = AIRPORTS_DB.get(dest, {})
    city    = info.get("city", dest)
    cc      = info.get("country", "")
    country = COUNTRY_NAMES.get(cc, cc)
    dur_min = f.get("total_duration", 0)

    # Merge top-level and first-leg extensions for baggage info
    extensions = list(f.get("extensions", []))
    if legs:
        extensions += list(legs[0].get("extensions", []))
    baggage = _parse_baggage(extensions)

    return {
        "destination":  f"{city}, {country}",
        "code":         dest,
        "city":         city,
        "country":      country,
        "flag":         flag_emoji(cc),
        "country_code": cc.lower() if cc else "",
        "airline":      " + ".join({l.get("airline", "—") for l in legs}),
        "price":        f.get("price"),
        "duration":     f"{dur_min // 60}h {dur_min % 60}m",
        "duration_min": dur_min,
        "stops":        "Direct" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}",
        "departure":    legs[0].get("departure_airport", {}).get("time", "—") if legs else "—",
        "arrival":      legs[-1].get("arrival_airport", {}).get("time", "—") if legs else "—",
        "type":         "Best" if id(f) in best_set else "Other",
        "baggage":      baggage,
    }


def search_one(
    api_key: str,
    origin: str,
    dest: str,
    dep_date: str,
    ret_date: str | None,
    trip_type: int,
    adults: int,
    cabin: int,
    currency: str = "INR",
) -> tuple[str, list[dict] | None, str | None]:
    params = {
        "engine":         "google_flights",
        "departure_id":   origin,
        "arrival_id":     dest,
        "outbound_date":  dep_date,
        "type":           trip_type,
        "adults":         adults,
        "travel_class":   cabin,
        "currency":       currency,
        "hl":             "en",
        "api_key":        api_key,
    }
    if trip_type == 1 and ret_date:
        params["return_date"] = ret_date

    try:
        r = requests.get("https://serpapi.com/search", params=params, timeout=20)
        r.raise_for_status()
        data = r.json()

        if "error" in data:
            return dest, None, data["error"]

        best    = data.get("best_flights", [])
        other   = data.get("other_flights", [])
        all_f   = best + other
        best_ids = {id(f) for f in best}

        if not all_f:
            return dest, None, "no results"

        parsed = [_parse_flight(f, dest, best_ids) for f in all_f if f.get("flights") and f.get("price")]
        return dest, parsed, None

    except Exception as exc:
        return dest, None, str(exc)


def search_many(
    api_key: str,
    origin: str,
    destinations: list[str],
    dep_date: str,
    ret_date: str | None,
    trip_type: int,
    adults: int,
    cabin: int,
    currency: str = "INR",
    max_workers: int = 8,
) -> tuple[list[dict], list[dict]]:
    """Run parallel SerpAPI searches. Returns (results, errors)."""
    all_rows: list[dict] = []
    errors:   list[dict] = []

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {
            ex.submit(search_one, api_key, origin, dest,
                      dep_date, ret_date, trip_type, adults, cabin, currency): dest
            for dest in destinations
        }
        for fut in as_completed(futures):
            dest, rows, err = fut.result()
            if rows:
                all_rows.extend(rows)
            if err:
                errors.append({"destination": dest, "error": err})

    return all_rows, errors
