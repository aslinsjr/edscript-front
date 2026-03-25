import { useState, useEffect } from 'react';
import { fetchOdds, fetchOddsSummary } from '../../api/client.js';
import './OddsTab.css';

// ─── estrutura real da API ─────────────────────────────────────────────────
// data.results.odds["1_1"] = array de snapshots, index 0 = mais recente
// data.results.odds["1_3"] = Over/Under
// Campos: home_od, draw_od, away_od / over_od, under_od, handicap

function getOddsMarket(data, key) {
  const arr = data?.results?.odds?.[key];
  if (Array.isArray(arr) && arr.length > 0) return arr[0]; // index 0 = mais recente
  return null;
}

function extract1x2(data) {
  // full odds endpoint
  const m = getOddsMarket(data, '1_1');
  if (m?.home_od) return { home: m.home_od, draw: m.draw_od, away: m.away_od };

  // summary endpoint — campos diretos em results
  const r = data?.results;
  if (r?.home_od) return { home: r.home_od, draw: r.draw_od, away: r.away_od };
  if (r?.['1'])   return { home: r['1'],     draw: r['X'],     away: r['2'] };

  return null;
}

function extractOU(data) {
  const m = getOddsMarket(data, '1_3');
  if (!m?.over_od) return null;
  return { handicap: m.handicap || '2.5', over: m.over_od, under: m.under_od };
}

function extractHistory(data) {
  const arr = data?.results?.odds?.['1_1'];
  if (!Array.isArray(arr) || arr.length < 2) return null;
  // índice 0 = mais recente; pegamos os primeiros 6 e invertemos para ordem cronológica
  return [...arr.slice(0, 6)].reverse();
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
          <div className="section-title" style={{ marginTop: 20 }}>Movimento 1×2 (últimas 6 atualizações)</div>
          <table className="odds-history-table">
            <thead>
              <tr>
                <th>Placar</th>
                <th>Min</th>
                <th style={{ color: '#58a6ff' }}>{homeName.split(' ')[0]}</th>
                <th>Emp</th>
                <th style={{ color: '#f0883e' }}>{awayName.split(' ')[0]}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="odds-hist-time">{h.ss || '—'}</td>
                  <td className="odds-hist-time">{h.time_str ?? '—'}</td>
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
