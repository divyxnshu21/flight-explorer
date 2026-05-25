const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function searchAirports(q, limit = 10) {
  return request(`/api/airports/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export async function searchFlights({ origin, destinations, depDate, retDate, tripType, adults, cabin, currency = 'INR' }) {
  return request('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destinations,
      dep_date: depDate,
      ret_date: retDate || null,
      trip_type: tripType,
      adults,
      cabin,
      currency,
    }),
  });
}

export async function aiSearch(query) {
  return request('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
}

export async function getHealth() {
  return request('/health');
}
