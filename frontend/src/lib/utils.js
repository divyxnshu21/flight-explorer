// ── URL share helpers ─────────────────────────────────────────────────────────

export function encodeShareUrl(settings, selected) {
  const params = new URLSearchParams();
  if (settings.origin)   params.set('from', settings.origin.code);
  if (settings.depDate)  params.set('dep',  settings.depDate);
  if (settings.retDate)  params.set('ret',  settings.retDate);
  params.set('type',   settings.tripType);
  params.set('adults', settings.adults);
  params.set('cabin',  settings.cabin);
  if (selected && selected.size > 0) params.set('to', [...selected].join(','));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function decodeShareUrl() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  if (params.has('from'))   result.originCode  = params.get('from');
  if (params.has('dep'))    result.depDate      = params.get('dep');
  if (params.has('ret'))    result.retDate      = params.get('ret');
  if (params.has('type'))   result.tripType     = Number(params.get('type'));
  if (params.has('adults')) result.adults       = Number(params.get('adults'));
  if (params.has('cabin'))  result.cabin        = Number(params.get('cabin'));
  if (params.has('to'))     result.destinations = params.get('to').split(',').filter(Boolean);
  return result;
}

export function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Indian number formatting: 1,23,456 ───────────────────────────────────────
export function formatINR(n) {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

export function defaultDepDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function defaultRetDate() {
  const d = new Date();
  d.setDate(d.getDate() + 37);
  return d.toISOString().slice(0, 10);
}

export function csvDownload(rows) {
  const headers = ['Destination', 'Code', 'City', 'Country', 'Airline', 'Price (INR)', 'Duration', 'Stops', 'Departure', 'Arrival', 'Type'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.destination}"`,
      r.code,
      `"${r.city}"`,
      `"${r.country}"`,
      `"${r.airline}"`,
      r.price,
      `"${r.duration}"`,
      `"${r.stops}"`,
      `"${r.departure}"`,
      `"${r.arrival}"`,
      r.type,
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flightdesk_results.csv';
  a.click();
  URL.revokeObjectURL(url);
}
