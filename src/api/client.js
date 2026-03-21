const BASE = 'https://edscript-api.vercel.app';

const cache = new Map();
const CACHE_TTL = 30_000; // 30 segundos

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error('HTTP 429 — limite de requisições atingido. Tente novamente em instantes.');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

export async function fetchEvents(endpoint, params = {}) {
  const url = new URL(BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  const key = url.toString();

  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchWithRetry(key);
  setCached(key, data);
  return data;
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
