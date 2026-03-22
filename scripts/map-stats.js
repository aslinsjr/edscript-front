/**
 * map-stats.js
 * Varre TODOS os endpoints (inplay, upcoming, ended) para cada esporte
 * e exibe quais campos de `stats` são retornados, com exemplos.
 *
 * Uso:
 *   node scripts/map-stats.js
 *   node scripts/map-stats.js --sport futebol
 */

const BASE = 'https://edscript-api.vercel.app';

const ENDPOINTS = [
  '/api/events/inplay',
  '/api/events/upcoming',
  '/api/events/ended',
];

const SPORTS = [
  { id: 1,   slug: 'futebol',           name: 'Futebol',           type: 'soccer' },
  { id: 13,  slug: 'tenis',             name: 'Tênis',             type: 'tennis' },
  { id: 18,  slug: 'basquete',          name: 'Basquete',          type: 'basketball' },
  { id: 17,  slug: 'hockey-no-gelo',    name: 'Hockey no Gelo',    type: 'icehockey' },
  { id: 12,  slug: 'futebol-americano', name: 'Futebol Americano', type: 'generic' },
  { id: 78,  slug: 'handebol',          name: 'Handebol',          type: 'handball' },
  { id: 91,  slug: 'volei',             name: 'Vôlei',             type: 'volleyball' },
  { id: 92,  slug: 'tenis-de-mesa',     name: 'Tênis de Mesa',     type: 'tabletennis' },
  { id: 83,  slug: 'futsal',            name: 'Futsal',            type: 'soccer' },
  { id: 9,   slug: 'boxe',             name: 'Boxe',              type: 'combat' },
  { id: 162, slug: 'mma',              name: 'MMA / UFC',         type: 'combat' },
  { id: 16,  slug: 'beisebol',          name: 'Beisebol',          type: 'generic' },
  { id: 14,  slug: 'snooker',           name: 'Snooker',           type: 'generic' },
  { id: 94,  slug: 'badminton',         name: 'Badminton',         type: 'generic' },
  { id: 95,  slug: 'volei-de-praia',    name: 'Vôlei de Praia',   type: 'volleyball' },
  { id: 151, slug: 'esports',           name: 'E-Sports',          type: 'generic' },
  { id: 8,   slug: 'rugby-union',       name: 'Rugby Union',       type: 'generic' },
  { id: 19,  slug: 'rugby-league',      name: 'Rugby League',      type: 'generic' },
  { id: 3,   slug: 'cricket',           name: 'Cricket',           type: 'generic' },
  { id: 15,  slug: 'dardos',            name: 'Dardos',            type: 'generic' },
  { id: 110, slug: 'polo-aquatico',     name: 'Polo Aquático',    type: 'generic' },
];

const args = process.argv.slice(2);
const filterSlug = args[args.indexOf('--sport') + 1] || null;
const sports = filterSlug ? SPORTS.filter(s => s.slug === filterSlug) : SPORTS;

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtVal(val) {
  if (Array.isArray(val))
    return `array[${val.length}]  ex: ${JSON.stringify(val.slice(0, 2))}`;
  if (val !== null && typeof val === 'object')
    return `object       ex: ${JSON.stringify(val).slice(0, 60)}`;
  return `${String(val).slice(0, 20).padEnd(20)}  (${typeof val})`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (res.status === 429) throw new Error('429 rate-limit — aguardando...');
  if (!res.ok)            throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── busca o primeiro evento com stats num endpoint ──────────────────────────

async function findEventWithStats(endpoint, sportId) {
  const url = `${BASE}${endpoint}?sport_id=${sportId}`;
  let data;
  try {
    data = await fetchJson(url);
  } catch (err) {
    return { error: err.message };
  }
  const list = Array.isArray(data) ? data : (data.results || data.events || data.data || []);
  const ev = list.find(e => e.stats && Object.keys(e.stats).length > 0);
  return { total: list.length, ev: ev || null };
}

// ─── principal ───────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${'═'.repeat(64)}`);
  console.log(' map-stats  •  todos os endpoints × todos os esportes');
  console.log(`${'═'.repeat(64)}\n`);

  // Mapa global: type → Set de campos
  const globalByType = {};

  for (const sport of sports) {
    console.log(`\n▶ ${sport.name}  (id=${sport.id}, type=${sport.type})`);

    // Mapa por esporte: campo → {endpoints onde aparece, exemplo de valor}
    const fieldMap = {};
    let foundAny = false;

    for (const endpoint of ENDPOINTS) {
      const label = endpoint.split('/').pop(); // inplay | upcoming | ended
      process.stdout.write(`  [${label}] `);

      const { error, total, ev } = await findEventWithStats(endpoint, sport.id);
      await sleep(700); // respeita rate limit

      if (error) {
        console.log(`⚠  ${error}`);
        continue;
      }

      if (!ev) {
        console.log(`— nenhum stats (${total} eventos)`);
        continue;
      }

      const keys = Object.keys(ev.stats).sort();
      console.log(`✓ ${keys.length} campos  (evento: ${ev.home?.name || '?'} vs ${ev.away?.name || '?'})`);
      foundAny = true;

      keys.forEach(k => {
        if (!fieldMap[k]) fieldMap[k] = { endpoints: [], example: ev.stats[k] };
        fieldMap[k].endpoints.push(label);
      });
    }

    if (!foundAny) {
      console.log('  — nenhum evento com stats encontrado em nenhum endpoint');
      continue;
    }

    // Exibe tabela de campos deste esporte
    const allFields = Object.keys(fieldMap).sort();
    console.log(`\n  Campos encontrados (${allFields.length}):\n`);
    allFields.forEach(k => {
      const { endpoints, example } = fieldMap[k];
      const where = endpoints.join(', ').padEnd(28);
      console.log(`    ${k.padEnd(28)} [${where}]  ${fmtVal(example)}`);
    });

    // Acumula no mapa global por type
    if (!globalByType[sport.type]) globalByType[sport.type] = new Set();
    allFields.forEach(k => globalByType[sport.type].add(k));
  }

  // ─── resumo final ────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`);
  console.log(' RESUMO — campos únicos por type de esporte\n');

  for (const [type, keys] of Object.entries(globalByType)) {
    console.log(`  ${type}:`);
    [...keys].sort().forEach(k => console.log(`    - ${k}`));
    console.log();
  }

  console.log('Concluído.\n');
}

run().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
