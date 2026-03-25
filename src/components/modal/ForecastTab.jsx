import { useState, useEffect } from 'react';
import { fetchForecast } from '../../api/client.js';
import './ForecastTab.css';

// ─── estrutura real da API ─────────────────────────────────────────────────
// data.results.teams             = { home, away }
// data.results.probabilities.blended = { home_win, draw, away_win }
// data.results.lambdas           = { home_goals, away_goals, ... }
// data.results.topScores         = [{ score: "AxB", p: 0.178 }, ...]
// data.results.scoreMatrix       = number[][] (6x6, [homeGoals][awayGoals])

function extractForecast(data) {
  const r = data?.results;
  if (!r) return null;

  const probs = r.probabilities?.blended || r.probabilities;
  const teams = r.teams || {};

  return {
    homeName: teams.home || null,
    awayName: teams.away || null,
    winHome:  probs?.home_win  ?? null,
    draw:     probs?.draw      ?? null,
    winAway:  probs?.away_win  ?? null,
    xgHome:   r.lambdas?.home_goals ?? null,
    xgAway:   r.lambdas?.away_goals ?? null,
    topScores: Array.isArray(r.topScores) ? r.topScores : [],
    model:    r.probabilities?.model_used || null,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────

function pctStr(val) {
  if (val === null || val === undefined) return null;
  const v = parseFloat(val);
  // valores já são frações (0.45) ou percentuais (45)?
  return v <= 1 ? (v * 100).toFixed(1) + '%' : v.toFixed(1) + '%';
}

function pctNum(val) {
  if (val === null || val === undefined) return 0;
  const v = parseFloat(val);
  return v <= 1 ? v * 100 : v;
}

// "AxB" → { home: "A", away: "B" }
function parseScore(scoreStr) {
  if (!scoreStr) return { home: '?', away: '?' };
  const parts = String(scoreStr).split('x');
  return { home: parts[0] ?? '?', away: parts[1] ?? '?' };
}

// ─── barra de probabilidade ───────────────────────────────────────────────

function ProbBar({ label, value, color }) {
  const num = pctNum(value);
  if (value === null) return null;
  return (
    <div className="forecast-prob-row">
      <div className="forecast-prob-header">
        <span className="forecast-prob-label">{label}</span>
        <span className="forecast-prob-val" style={{ color }}>{pctStr(value)}</span>
      </div>
      <div className="forecast-prob-track">
        <div className="forecast-prob-fill" style={{ width: `${Math.min(num, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── top placares ─────────────────────────────────────────────────────────

function TopScores({ scores, homeName, awayName }) {
  if (!scores || scores.length === 0) return null;
  return (
    <>
      <div className="section-title" style={{ marginTop: 20 }}>Top 10 Placares Prováveis</div>
      <table className="forecast-score-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Placar</th>
            <th>Prob.</th>
          </tr>
        </thead>
        <tbody>
          {scores.slice(0, 10).map((s, i) => {
            const { home, away } = parseScore(s.score);
            return (
              <tr key={i} className={i === 0 ? 'score-row-top' : ''}>
                <td className="score-rank">{i + 1}</td>
                <td className="score-result">
                  <span className="score-home">{homeName.split(' ')[0]}</span>
                  <strong> {home}–{away} </strong>
                  <span className="score-away">{awayName.split(' ')[0]}</span>
                </td>
                <td className="score-prob">{pctStr(s.p)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

// ─── componente principal ─────────────────────────────────────────────────

export default function ForecastTab({ ev }) {
  const [status, setStatus] = useState('idle');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setErrMsg('');

    fetchForecast(ev.id)
      .then(d  => { if (!cancelled) { setData(d);          setStatus('done');  } })
      .catch(e => { if (!cancelled) { setErrMsg(e.message); setStatus('error'); } });

    return () => { cancelled = true; };
  }, [ev.id]);

  if (status === 'loading') {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <span>Calculando previsão estatística...</span>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="ai-error"><strong>Erro ao calcular previsão:</strong> {errMsg}</div>;
  }
  if (status !== 'done') return null;

  const f = extractForecast(data);
  if (!f) return <div className="empty-tab"><p>Previsão não disponível para este evento.</p></div>;

  const homeName = f.homeName || ev.home?.name || 'Casa';
  const awayName = f.awayName || ev.away?.name || 'Visitante';
  const hasProbs = f.winHome !== null || f.draw !== null || f.winAway !== null;

  return (
    <div className="tab-section">
      <div className="section-title">Previsão Estatística</div>
      {f.model && <p className="forecast-note">Modelo: {f.model}</p>}

      {hasProbs && (
        <div className="forecast-probs">
          <ProbBar label={homeName} value={f.winHome} color="#58a6ff" />
          <ProbBar label="Empate"   value={f.draw}    color="#8b949e" />
          <ProbBar label={awayName} value={f.winAway} color="#f0883e" />
        </div>
      )}

      {(f.xgHome !== null || f.xgAway !== null) && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Gols Esperados (xG)</div>
          <div className="xg-row">
            <div className="xg-team">
              <span className="xg-name xg-home">{homeName}</span>
              <span className="xg-val">{parseFloat(f.xgHome)?.toFixed(2) ?? '—'}</span>
            </div>
            <span className="xg-sep">×</span>
            <div className="xg-team xg-team-away">
              <span className="xg-val">{parseFloat(f.xgAway)?.toFixed(2) ?? '—'}</span>
              <span className="xg-name xg-away">{awayName}</span>
            </div>
          </div>
        </>
      )}

      <TopScores scores={f.topScores} homeName={homeName} awayName={awayName} />
    </div>
  );
}
