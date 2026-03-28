import { useState, useEffect } from 'react';
import { fetchOdds, fetchOddsSummary } from '../../api/client.js';
import './OddsTab.css';

// ─── normalização: suporta dois formatos da API ────────────────────────────
//
// Formato A (v2/event/odds) — array por mercado:
//   data.results.odds = { "1_1": [ { home_od, draw_od, away_od, ss, time_str }, ... ] }
//
// Formato B (v2/event/odds/summary) — bookmakers com snapshots:
//   data.results = { "Bet365": { odds: { start, kickoff, end } }, ... }
//   Cada snapshot: { "1_1": { home_od, draw_od, away_od }, "1_3": { over_od, ... } }

const BM_PRIORITY = ['Bet365', 'PinnacleSports', 'WilliamHill', 'Ladbrokes', 'UniBet', 'YSB88'];
const SNAP_PRIORITY = ['end', 'kickoff', 'start'];
const SNAP_LABEL = { start: 'Abertura', kickoff: 'Início', end: 'Atual' };

// Detecta se veio no formato array (A) ou bookmaker (B)
function isArrayFormat(data) {
  const odds = data?.results?.odds;
  if (!odds) return false;
  const firstVal = Object.values(odds)[0];
  return Array.isArray(firstVal);
}

// ─── extratores formato A ─────────────────────────────────────────────────

function getLatestOdds(data, market) {
  const arr = data?.results?.odds?.[market];
  return arr?.length ? arr[0] : null; // índice 0 = mais recente
}

function extract1x2_A(data) {
  const m = getLatestOdds(data, '1_1');
  if (m?.home_od) return { home: m.home_od, draw: m.draw_od, away: m.away_od };
  return null;
}

function extractOU_A(data) {
  const m = getLatestOdds(data, '1_3');
  if (!m?.over_od) return null;
  return { handicap: m.handicap || '2.5', over: m.over_od, under: m.under_od };
}

function extractHistory_A(data) {
  const arr = data?.results?.odds?.['1_1'];
  if (!arr || arr.length < 2) return null;
  // amostra de até 5 pontos: mais antigo → mais recente
  const reversed = [...arr].reverse();
  const sample = reversed.length <= 5
    ? reversed
    : [0, 1, 2, 3, reversed.length - 1]
        .map(i => reversed[Math.min(i * Math.floor(reversed.length / 4), reversed.length - 1)])
        .filter((v, i, a) => a.indexOf(v) === i);
  return sample.map(m => ({
    label: m.time_str ? `${m.time_str}'` : '—',
    home_od: m.home_od,
    draw_od: m.draw_od,
    away_od: m.away_od,
    ss: m.ss,
  }));
}

// ─── extratores formato B ─────────────────────────────────────────────────

function getBestBookmaker(data) {
  const results = data?.results;
  if (!results || typeof results !== 'object') return null;
  for (const bm of BM_PRIORITY) {
    if (results[bm]) return { name: bm, data: results[bm] };
  }
  const first = Object.entries(results).find(([, v]) => v?.odds);
  return first ? { name: first[0], data: first[1] } : null;
}

function getMarket(bm, market) {
  if (!bm?.data?.odds) return null;
  for (const snap of SNAP_PRIORITY) {
    const m = bm.data.odds[snap]?.[market];
    if (m) return m;
  }
  return null;
}

function extract1x2_B(data) {
  const bm = getBestBookmaker(data);
  const m = getMarket(bm, '1_1');
  if (m?.home_od) return { home: m.home_od, draw: m.draw_od, away: m.away_od };
  return null;
}

function extractOU_B(data) {
  const bm = getBestBookmaker(data);
  const m = getMarket(bm, '1_3');
  if (!m?.over_od) return null;
  return { handicap: m.handicap || '2.5', over: m.over_od, under: m.under_od };
}

function extractHistory_B(data) {
  const bm = getBestBookmaker(data);
  if (!bm?.data?.odds) return null;
  const rows = SNAP_PRIORITY
    .map(snap => {
      const m = bm.data.odds[snap]?.['1_1'];
      return m ? { label: SNAP_LABEL[snap], home_od: m.home_od, draw_od: m.draw_od, away_od: m.away_od, ss: m.ss } : null;
    })
    .filter(Boolean);
  return rows.length >= 2 ? rows : null;
}

// ─── funções públicas (detectam o formato automaticamente) ─────────────────

function extract1x2(data) {
  return isArrayFormat(data) ? extract1x2_A(data) : extract1x2_B(data);
}

function extractOU(data) {
  return isArrayFormat(data) ? extractOU_A(data) : extractOU_B(data);
}

function extractHistory(data) {
  return isArrayFormat(data) ? extractHistory_A(data) : extractHistory_B(data);
}

// ─── helpers ──────────────────────────────────────────────────────────────

function toImplied(odd) {
  const v = parseFloat(odd);
  if (!v || v <= 0) return null;
  return ((1 / v) * 100).toFixed(0) + '%';
}

function getFavoriteType(odds) {
  const h = parseFloat(odds.home) || 99;
  const d = parseFloat(odds.draw) || 99;
  const a = parseFloat(odds.away) || 99;
  const min = Math.min(h, d, a);
  if (min === h) return 'home';
  if (min === d) return 'draw';
  return 'away';
}

// ─── bloco visual de odd ──────────────────────────────────────────────────

function OddsBlock({ label, value, implied, highlight }) {
  return (
    <div className={`odds-block${highlight ? ' odds-block-fav' : ''}`}>
      <div className="odds-block-label">{label}</div>
      <div className="odds-block-value">{value || '—'}</div>
      {implied && <div className="odds-block-implied">{implied}</div>}
    </div>
  );
}

// ─── vista iniciante ──────────────────────────────────────────────────────

function BeginnerView({ data, ev }) {
  const homeName = ev.home?.name || 'Casa';
  const awayName = ev.away?.name || 'Visitante';
  const odds = extract1x2(data);

  if (!odds) return <div className="empty-tab"><p>Odds não disponíveis para este evento.</p></div>;

  const favType  = getFavoriteType(odds);
  const favLabel = favType === 'home' ? homeName : favType === 'draw' ? 'Empate' : awayName;

  return (
    <div className="tab-section">
      <div className="section-title">Odds do Jogo</div>

      <div className="odds-favorite-banner">
        <span className="odds-fav-tag">Favorito</span>
        <span className="odds-fav-name">{favLabel}</span>
      </div>

      <div className="odds-1x2-grid">
        <OddsBlock label={homeName} value={odds.home} implied={toImplied(odds.home)} highlight={favType === 'home'} />
        {odds.draw && (
          <OddsBlock label="Empate" value={odds.draw} implied={toImplied(odds.draw)} highlight={favType === 'draw'} />
        )}
        <OddsBlock label={awayName} value={odds.away} implied={toImplied(odds.away)} highlight={favType === 'away'} />
      </div>

      <p className="odds-note">Quanto menor a odd, maior a probabilidade implícita no mercado.</p>
    </div>
  );
}

// ─── vista intermediária / avançada ───────────────────────────────────────

function FullView({ data, ev, isAdvanced }) {
  const homeName = ev.home?.name || 'Casa';
  const awayName = ev.away?.name || 'Visitante';
  const odds    = extract1x2(data);
  const ou      = extractOU(data);
  const history = isAdvanced ? extractHistory(data) : null;

  if (!odds && !ou) {
    return <div className="empty-tab"><p>Odds não disponíveis para este evento.</p></div>;
  }

  return (
    <div className="tab-section">
      {odds && (
        <>
          <div className="section-title">1 × 2</div>
          <div className="odds-1x2-grid">
            <OddsBlock label={homeName} value={odds.home} implied={toImplied(odds.home)} />
            {odds.draw && <OddsBlock label="Empate" value={odds.draw} implied={toImplied(odds.draw)} />}
            <OddsBlock label={awayName} value={odds.away} implied={toImplied(odds.away)} />
          </div>
        </>
      )}

      {ou && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Over / Under {ou.handicap}</div>
          <div className="odds-1x2-grid">
            <OddsBlock label="Over"  value={ou.over}  implied={toImplied(ou.over)} />
            <OddsBlock label="Under" value={ou.under} implied={toImplied(ou.under)} />
          </div>
        </>
      )}

      {isAdvanced && history && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Movimento 1×2</div>
          <table className="odds-history-table">
            <thead>
              <tr>
                <th>Momento</th>
                <th>Placar</th>
                <th style={{ color: '#58a6ff' }}>{homeName.split(' ')[0]}</th>
                <th>Emp</th>
                <th style={{ color: '#f0883e' }}>{awayName.split(' ')[0]}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="odds-hist-time">{h.label}</td>
                  <td className="odds-hist-time">{h.ss || '—'}</td>
                  <td>{h.home_od}</td>
                  <td>{h.draw_od}</td>
                  <td>{h.away_od}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────

export default function OddsTab({ ev, level }) {
  const [status, setStatus] = useState('idle');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const isBeginner = level === 'beginner';

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setErrMsg('');

    const fetcher = isBeginner ? fetchOddsSummary : fetchOdds;
    fetcher(ev.id)
      .then(d  => { if (!cancelled) { setData(d);          setStatus('done');  } })
      .catch(e => { if (!cancelled) { setErrMsg(e.message); setStatus('error'); } });

    return () => { cancelled = true; };
  }, [ev.id, isBeginner]);

  if (status === 'loading') {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <span>Carregando odds...</span>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="ai-error"><strong>Erro ao carregar odds:</strong> {errMsg}</div>;
  }
  if (status === 'done') {
    if (!data) return <div className="empty-tab"><p>Odds não disponíveis para este evento.</p></div>;
    if (isBeginner) return <BeginnerView data={data} ev={ev} />;
    return <FullView data={data} ev={ev} isAdvanced={level === 'advanced'} />;
  }
  return null;
}
