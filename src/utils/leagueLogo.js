const SEARCH  = 'https://api.sofascore.com/api/v1/search/all';
const CDN     = 'https://img.sofascore.com/api/v1/unique-tournament';

// Cache permanente: leagueId → imageUrl | null
const cache   = new Map();
// Evita requisições duplicadas em voo
const pending = new Map();

// Fila — 1 requisição por vez com 300ms de intervalo
let queue      = [];
let processing = false;

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    if (!processing) processQueue();
  });
}

async function processQueue() {
  if (!queue.length) { processing = false; return; }
  processing = true;
  const { fn, resolve, reject } = queue.shift();
  try   { resolve(await fn()); }
  catch (e) { reject(e); }
  setTimeout(processQueue, 300);
}

// Remove ruído do nome antes de buscar
const COUNTRY_RE = /^(Argentina|Australia|Austria|Belgium|Bolivia|Brazil|Bulgaria|Canada|Chile|China|Colombia|Croatia|Czech|Denmark|Ecuador|Egypt|England|Finland|France|Germany|Ghana|Greece|Hungary|India|Ireland|Israel|Italy|Japan|Mexico|Morocco|Netherlands|Nigeria|Northern Ireland|Norway|Peru|Poland|Portugal|Romania|Russia|Saudi Arabia|Scotland|Serbia|Slovakia|Slovenia|South Africa|South Korea|Spain|Sweden|Switzerland|Turkey|Ukraine|United States|Uruguay|USA|Venezuela|Wales)\s+/i;

function cleanName(name) {
  return name
    .replace(COUNTRY_RE, '')
    .replace(/^(UEFA|CONMEBOL|CONCACAF|CAF|AFC|FIBA|ATP|WTA|NBA|NFL|NHL|MLB|MLS)\s+/i, '')
    .replace(/\s+\d{4}(-\d{2,4})?$/, '')
    .split(/\s+/).slice(0, 4).join(' ')
    .trim();
}

/** Retorna logo já cacheada sem Promise — use no useState(() => ...) */
export function getCachedLogo(leagueId) {
  return cache.get(String(leagueId)) ?? null;
}

export async function fetchLeagueLogo(leagueId, leagueName, cc) {
  const key = String(leagueId);

  if (cache.has(key))   return cache.get(key);
  if (pending.has(key)) return pending.get(key);

  const query = cleanName(leagueName || '');
  if (!query) { cache.set(key, null); return null; }

  const promise = (async () => {
    try {
      const data = await enqueue(async () => {
        const res = await fetch(`${SEARCH}?q=${encodeURIComponent(query)}`);
        if (!res.ok) return null;
        return res.json();
      });

      if (!data) { cache.set(key, null); return null; }

      // Filtra só torneios únicos (ligas)
      const tournaments = (data.results || [])
        .filter(r => r.type === 'uniqueTournament')
        .map(r => r.entity);

      if (!tournaments.length) { cache.set(key, null); return null; }

      // Tenta casar pelo país via cc
      let match = null;
      if (cc && tournaments.length > 1) {
        const ccLower = cc.toLowerCase();
        match = tournaments.find(t => {
          const flag = (t.category?.flag || t.category?.slug || '').toLowerCase();
          return flag.includes(ccLower) || ccLower.includes(flag.slice(0, 2));
        });
      }
      if (!match) match = tournaments[0];

      const logo = match?.id ? `${CDN}/${match.id}/image` : null;
      cache.set(key, logo);
      return logo;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);
  return promise;
}
