import { useState, useEffect } from 'react';
import { fetchStatsTrend } from '../../api/client.js';
import './TrendsTab.css';

// ─── estrutura real da API ─────────────────────────────────────────────────
// data.results.<stat_name> = { home: [{time_str, val, created_at}], away: [...] }
// Ordenado cronologicamente (index 0 = mais antigo, último = mais recente)
// Stat key: possession (não possession_rt)

const METRICS_INTERMEDIATE = [
  { key: 'attacks',           label: 'Ataques' },
  { key: 'dangerous_attacks', label: 'At. Perigosos' },
  { key: 'on_target',         label: 'Chutes no Alvo' },
  { key: 'possession',        label: 'Posse de Bola', unit: '%' },
];

const METRICS_ADVANCED = [
  ...METRICS_INTERMEDIATE,
  { key: 'off_target',   label: 'Chutes Fora' },
  { key: 'corners',      label: 'Escanteios' },
  { key: 'goals',        label: 'Gols' },
  { key: 'yellowcards',  label: 'Cartões Amarelos' },
];

function getLatestVal(statObj, side) {
  const arr = statObj?.[side];
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return Number(arr[arr.length - 1].val) || 0;
}

function getSeries(statObj, side) {
  const arr = statObj?.[side];
  if (!Array.isArray(arr)) return [];
  return arr.map(e => ({ time: e.time_str, val: Number(e.val) || 0 }));
}

// ─── barra de stat ────────────────────────────────────────────────────────

function TrendBar({ homeVal, awayVal, label, unit = '' }) {
  const total   = homeVal + awayVal;
  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
  const awayPct = total > 0 ? (awayVal / total) * 100 : 50;

  return (
    <div className="trend-bar-block">
      <div className="trend-bar-label-row">
        <span className="trend-val-home">{homeVal}{unit}</span>
        <span className="trend-label">{label}</span>
        <span className="trend-val-away">{awayVal}{unit}</span>
      </div>
      <div className="trend-bar-track">
        <div className="trend-bar-home" style={{ width: `${homePct}%` }} />
        <div className="trend-bar-away" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}

// ─── linha de evolução (início → fim) ────────────────────────────────────

function EvoRow({ label, series }) {
  if (series.length < 2) return null;
  const first = series[0].val;
  const last  = series[series.length - 1].val;
  const diff  = last - first;
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
  const color = diff > 0 ? '#3fb950' : diff < 0 ? '#f0883e' : '#8b949e';
  return (
    <div className="trend-evolution">
      <span className="trend-evo-label">{label}</span>
      <span className="trend-evo-range">
        {first} → {last}
        <span style={{ color, marginLeft: 4, fontWeight: 700 }}>{arrow}</span>
      </span>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────

export default function TrendsTab({ ev, level }) {
  const [status, setStatus] = useState('idle');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const isAdvanced = level === 'advanced';
  const metrics    = isAdvanced ? METRICS_ADVANCED : METRICS_INTERMEDIATE;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setErrMsg('');

    fetchStatsTrend(ev.id)
      .then(d  => { if (!cancelled) { setData(d);          setStatus('done');  } })
      .catch(e => { if (!cancelled) { setErrMsg(e.message); setStatus('error'); } });

    return () => { cancelled = true; };
  }, [ev.id]);

  if (status === 'loading') {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <span>Carregando tendências...</span>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="ai-error"><strong>Erro ao carregar tendências:</strong> {errMsg}</div>;
  }
  if (status !== 'done') return null;

  const results  = data?.results;
  const homeName = ev.home?.name || 'Casa';
  const awayName = ev.away?.name || 'Visitante';

  if (!results || Object.keys(results).length === 0) {
    return <div className="empty-tab"><p>Tendências não disponíveis para este evento.</p></div>;
  }

  const available = metrics.filter(m => results[m.key]);

  if (available.length === 0) {
    return <div className="empty-tab"><p>Tendências não disponíveis para este evento.</p></div>;
  }

  return (
    <div className="tab-section">
      <div className="section-title">Tendências da Partida</div>

      <div className="trend-teams-header">
        <span className="trend-home-label">{homeName}</span>
        <span className="trend-away-label">{awayName}</span>
      </div>

      <div className="trend-bars">
        {available.map(m => (
          <TrendBar
            key={m.key}
            label={m.label}
            homeVal={getLatestVal(results[m.key], 'home')}
            awayVal={getLatestVal(results[m.key], 'away')}
            unit={m.unit || ''}
          />
        ))}
      </div>

      {isAdvanced && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Evolução no Jogo</div>
          <div className="trend-evolution-list">
            {available.map(m => {
              const hSeries = getSeries(results[m.key], 'home');
              const aSeries = getSeries(results[m.key], 'away');
              return [
                hSeries.length >= 2 && (
                  <EvoRow key={`h-${m.key}`} label={`${m.label} — ${homeName}`} series={hSeries} />
                ),
                aSeries.length >= 2 && (
                  <EvoRow key={`a-${m.key}`} label={`${m.label} — ${awayName}`} series={aSeries} />
                ),
              ];
            })}
          </div>
        </>
      )}
    </div>
  );
}
