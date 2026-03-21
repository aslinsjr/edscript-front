const BASE = 'https://edscript-api.vercel.app';

export async function fetchEvents(endpoint, params = {}) {
  const url = new URL(BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function analyzeEvent(event) {
  const res = await fetch(BASE + '/api/analysis/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
