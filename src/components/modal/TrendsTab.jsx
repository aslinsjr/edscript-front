import { useState, useEffect } from 'react';
import { fetchStatsTrend } from '../../api/client.js';
import './TrendsTab.css';

// ─── normalização: suporta múltiplos formatos da API ──────────────────────
//
// Formato A (array cronológico):
//   { home: [{time_str, val, created_at}], away: [...] }
//
// Formato B (valores planos):
//   { home: "3", away: "5" }  ou  { home: 3, away: 5 }

function normalizeStat(statData) {
  if (!statData) return null;

  // Formato A — arrays
  if (Array.isArray(statData.home)) {
    const toSeries = arr =>
      arr.map(e => ({ time: Number(e.time_str) || 0, val: Number(e.val) || 0 }));
    const homeSeries = toSeries(statData.home);
    const awaySeries = toSeries(statData.away ?? []);
    return {
      home:        homeSeries.at(-1)?.val ?? 0,
      away:        awaySeries.at(-1)?.val ?? 0,
      homeSeries,
      awaySeries,
    };
  }

  // Formato B — valores planos
  if (statData.home != null) {
    return {
      home:        Number(statData.home) || 0,
      away:        Number(statData.away) || 0,
      homeSeries:  [],
      awaySeries:  [],
    };
  }

  return null;
}

// ─── métricas ─────────────────────────────────────────────────────────────

const METRICS_INTERMEDIATE = [
  { key: 'possession',        label: 'Posse de Bola',    unit: '%', isPossession: true },
  { key: 'on_target',         label: 'Chutes no Alvo' },
  { key: 'attacks',           label: 'Ataques' },
  { key: 'dangerous_attacks', label: 'Ataques Perigosos' },
];

const METRICS_ADVANCED = [
  ...METRICS_INTERMEDIATE,
  { key: 'off_target',   label: 'Chutes Fora' },
  { key: 'corners',      label: 'Escanteios' },
  { key: 'goals',        label: 'Gols' },
  { key: 'yellowcards',  label: 'Cartões Amarelos' },
];

// ─── momentum: compara 1ª metade vs 2ª metade da série ───────────────────

function getMomentum(series) {
  if (series.length < 4) return null;
  const half = Math.floor(series.length / 2);
  const firstRate  = (series[half - 1]?.val ?? 0) - (series[0]?.val ?? 0);
  const secondRate = (series.at(-1)?.val ?? 0)    - (series[half]?.val ?? 0);
  if (secondRate > firstRate + 1) return 'up';
  if (secondRate < firstRate - 1) return 'down';
  return 'neutral';
}

// ─── rótulo de dominância ─────────────────────────────────────────────────

function getDominanceLabel(home, away, homeName, awayName, isPossession) {
  const diff = home - away;
  if (isPossession) {
    if (diff > 10) return { text: `${homeName} dominando`, cls: 'dom-home' };
    if (diff < -10) return { text: `${awayName} dominando`, cls: 'dom-away' };
    return { text: 'Equilibrado', cls: 'dom-neutral' };
  }
  if (diff > 0) return { text: `${homeName} à frente`, cls: 'dom-home' };
  if (diff < 0) return { text: `${awayName} à frente`, cls: 'dom-away' };
  return { text: 'Igual', cls: 'dom-neutral' };
}

// ─── barra de stat ────────────────────────────────────────────────────────

function TrendBar({ stat, metric, homeName, awayName, isAdvanced }) {
  const { home, away, homeSeries, awaySeries } = stat;
  const total   = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = 100 - homePct;

  const unit = metric.unit || '';
  const dom  = getDominanceLabel(home, away, homeName, awayName, metric.isPossession);

  const hMomentum = isAdvanced ? getMomentum(homeSeries) : null;
  const aMomentum = isAdvanced ? getMomentum(awaySeries) : null;

  const momentumIcon = m => m === 'up' ? '↑' : m === 'down' ? '↓' : null;
  const momentumCls  = m => m === 'up' ? 'mom-up' : m === 'down' ? 'mom-down' : '';

  return (
    <div className="trend-bar-block">
      <div className="trend-metric-label">{metric.label}</div>

      <div className="trend-bar-row">
        <span className="trend-val-home">
          {home}{unit}
          {hMomentum && hMomentum !== 'neutral' && (
            <span className={`trend-momentum ${momentumCls(hMomentum)}`}>
              {momentumIcon(hMomentum)}
            </span>
          )}
        </span>

        <div className="trend-bar-track">
          <div className="trend-bar-home" style={{ width: `${homePct}%` }} />
          <div className="trend-bar-away" style={{ width: `${awayPct}%` }} />
        </div>

        <span className="trend-val-away">
          {aMomentum && aMomentum !== 'neutral' && (
            <span className={`trend-momentum ${momentumCls(aMomentum)}`}>
              {momentumIcon(aMomentum)}
            </span>
          )}
          {away}{unit}
        </span>
      </div>

      <div className={`trend-dominance ${dom.cls}`}>{dom.text}</div>
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
      .then(d  => { if (!cancelled) { setData(d);           setStatus('done');  } })
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

  const available = metrics
    .map(m => ({ metric: m, stat: normalizeStat(results[m.key]) }))
    .filter(({ stat }) => stat !== null);

  if (available.length === 0) {
    return <div className="empty-tab"><p>Tendências não disponíveis para este evento.</p></div>;
  }

  return (
    <div className="tab-section">
      <div className="trend-teams-header">
        <span className="trend-home-label">{homeName}</span>
        <span className="trend-header-center">Estatísticas ao Vivo</span>
        <span className="trend-away-label">{awayName}</span>
      </div>

      <div className="trend-bars">
        {available.map(({ metric, stat }) => (
          <TrendBar
            key={metric.key}
            stat={stat}
            metric={metric}
            homeName={homeName}
            awayName={awayName}
            isAdvanced={isAdvanced}
          />
        ))}
      </div>

      {isAdvanced && (
        <p className="trend-momentum-hint">
          ↑↓ indica tendência recente: se o time acelerou ou desacelerou na 2ª metade do jogo.
        </p>
      )}
    </div>
  );
}
