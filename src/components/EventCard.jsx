import { STATUS_MAP } from '../constants/status.js';
import { timerStr } from '../utils/sport.js';

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ScoreDisplay({ ev, sportType }) {
  const ss = ev.ss;
  if (!ss) return null;

  if (sportType === 'tennis' || sportType === 'tabletennis') {
    const parts = ss.split('-');
    const home = parts[0] || '0';
    const away = parts[1] || '0';
    const points = ev.points;
    return (
      <div className="card-score">
        {home} – {away}
        {points && (
          <span className="score-sub"> ({points})</span>
        )}
      </div>
    );
  }

  if (sportType === 'volleyball') {
    const parts = ss.split('-');
    const home = parts[0] || '0';
    const away = parts[1] || '0';
    const pts = ev.scores;
    let curSet = null;
    if (pts) {
      const keys = Object.keys(pts).map(Number).sort((a, b) => b - a);
      if (keys.length > 0) {
        const k = String(keys[0]);
        curSet = `${pts[k]?.home || 0}–${pts[k]?.away || 0}`;
      }
    }
    return (
      <div>
        <div className="card-score">{home} – {away}</div>
        {curSet && <div className="score-label">ponto: {curSet}</div>}
      </div>
    );
  }

  const parts = ss.split('-');
  const home = parts[0] || '0';
  const away = parts[1] || '0';
  return (
    <div className="card-score">{home} – {away}</div>
  );
}

function SoccerStatsPreview({ stats }) {
  if (!stats) return null;
  const possession = stats['1'];
  const shotsOnTarget = stats['7'];
  const corners = stats['43'];
  const hasData = possession || shotsOnTarget || corners;
  if (!hasData) return null;

  return (
    <div className="card-stats">
      {possession && (
        <div className="stat-row">
          <span>Posse</span>
          <strong>{possession.home}%–{possession.away}%</strong>
        </div>
      )}
      {shotsOnTarget && (
        <div className="stat-row">
          <span>Chutes no alvo</span>
          <strong>{shotsOnTarget.home}–{shotsOnTarget.away}</strong>
        </div>
      )}
      {corners && (
        <div className="stat-row">
          <span>Escanteios</span>
          <strong>{corners.home}–{corners.away}</strong>
        </div>
      )}
    </div>
  );
}

export default function EventCard({ ev, sportType, onClick }) {
  const status = STATUS_MAP[String(ev.time_status)] || { label: 'Desconhecido', cls: 'ended' };
  const timer = timerStr(ev, sportType);
  const dateStr = formatDate(ev.time);

  const isRacing = sportType === 'racing';
  const isCombat = sportType === 'combat';

  let matchupNode;
  if (isRacing) {
    matchupNode = (
      <div className="card-matchup">
        <span className="card-venue">{ev.league?.name || 'Corrida'}</span>
      </div>
    );
  } else if (isCombat) {
    matchupNode = (
      <div className="card-matchup">
        <span className="card-team">{ev.home?.name || 'Lutador A'}</span>
        <span className="card-sep">🥊</span>
        <span className="card-team">{ev.away?.name || 'Lutador B'}</span>
      </div>
    );
  } else {
    matchupNode = (
      <div className="card-matchup">
        <span className="card-team">{ev.home?.name || '—'}</span>
        <span className="card-sep">vs</span>
        <span className="card-team">{ev.away?.name || '—'}</span>
      </div>
    );
  }

  const leagueDisplay = isRacing
    ? (ev.league?.cc ? ev.league.cc.toUpperCase() : null)
    : ev.league?.name;

  return (
    <button className="event-card" onClick={onClick}>
      <div className="card-header">
        <div className="card-league">
          {leagueDisplay || ''}
          {isRacing && ev.extra?.num && (
            <span style={{ marginLeft: 6 }}>• Corrida {ev.extra.num}</span>
          )}
        </div>
        <div className="card-badges">
          <span className={`badge badge-${status.cls}`}>{status.label}</span>
          {timer && <span className="badge badge-timer">{timer}</span>}
        </div>
      </div>

      {matchupNode}

      {!isRacing && (
        <ScoreDisplay ev={ev} sportType={sportType} />
      )}

      {isRacing && ev.ss && (
        <div className="card-score">{ev.ss}</div>
      )}

      {dateStr && <div className="card-date">{dateStr}</div>}

      {sportType === 'soccer' && (
        <SoccerStatsPreview stats={ev.stats} />
      )}
    </button>
  );
}
