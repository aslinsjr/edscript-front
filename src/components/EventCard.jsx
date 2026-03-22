import { STATUS_MAP } from '../constants/status.js';
import './EventCard.css';
import { timerStr } from '../utils/sport.js';
import { TeamLogo } from './TeamLogo.jsx';

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function parseScore(ss) {
  if (!ss) return { home: null, away: null };
  const parts = ss.split('-');
  return { home: parts[0] ?? null, away: parts[1] ?? null };
}

// Mini barra de posse — só futebol ao vivo
function PossessionBar({ stats }) {
  const raw = stats?.possession_rt;
  if (!Array.isArray(raw)) return null;
  const home = parseFloat(raw[0]) || 0;
  const away = parseFloat(raw[1]) || 0;
  if (home === 0 && away === 0) return null;

  return (
    <div className="card-possession">
      <span className="card-possession-val">{home}%</span>
      <div className="card-possession-bar">
        <div className="card-possession-home" style={{ width: `${home}%` }} />
        <div className="card-possession-away" style={{ width: `${away}%` }} />
      </div>
      <span className="card-possession-val">{away}%</span>
    </div>
  );
}

export default function EventCard({ ev, sportType, onClick, onAIClick }) {
  const status    = STATUS_MAP[String(ev.time_status)] || { label: 'Desconhecido', cls: 'ended' };
  const timer     = timerStr(ev, sportType);
  const dateStr   = formatDate(ev.time);
  const isLive    = String(ev.time_status) === '1';
  const isRacing  = sportType === 'racing';
  const isCombat  = sportType === 'combat';
  const isSoccer  = sportType === 'soccer';
  const showAIBtn = String(ev.time_status) === '0' || isLive;
  const score     = parseScore(ev.ss);

  const leagueDisplay = isRacing
    ? (ev.league?.cc ? ev.league.cc.toUpperCase() : ev.league?.name)
    : ev.league?.name;

  // ─── Racing: layout simplificado ─────────────────────────────────────────
  if (isRacing) {
    return (
      <div className="event-card" onClick={onClick} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}>
        <div className="card-header">
          <div className="card-league">{leagueDisplay || 'Corrida'}</div>
          <div className="card-badges">
            <span className={`badge badge-${status.cls}`}>{status.label}</span>
            {timer && <span className="badge badge-timer">{timer}</span>}
          </div>
        </div>
        {ev.extra?.num && (
          <div className="card-teams">
            <div className="card-team-row">
              <span className="card-team-name">Corrida {ev.extra.num}</span>
              {ev.ss && <span className="card-team-score">{ev.ss}</span>}
            </div>
          </div>
        )}
        {dateStr && (
          <div className="card-footer">
            <span className="card-date">{dateStr}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Layout padrão (futebol, basquete, tênis, combate…) ──────────────────
  const homeName  = isCombat ? (ev.home?.name || 'Lutador A') : (ev.home?.name || '—');
  const awayName  = isCombat ? (ev.away?.name || 'Lutador B') : (ev.away?.name || '—');
  const sepLabel  = isCombat ? '🥊' : null;

  return (
    <div className="event-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      {/* ── Cabeçalho: liga + status ── */}
      <div className="card-header">
        <div className="card-league">{leagueDisplay || ''}</div>
        <div className="card-badges">
          <span className={`badge badge-${status.cls}`}>{status.label}</span>
          {timer && <span className="badge badge-timer">{timer}</span>}
        </div>
      </div>

      {/* ── Times ── */}
      <div className="card-teams">
        <div className="card-team-row">
          <TeamLogo imageId={ev.home?.image_id} name={homeName} size={22} />
          <span className="card-team-name">{homeName}</span>
          {score.home !== null && (
            <span className={`card-team-score${isLive ? ' score-live' : ''}`}>
              {score.home}
            </span>
          )}
        </div>

        {sepLabel && (
          <div className="card-sep-row">{sepLabel}</div>
        )}

        <div className="card-team-row">
          <TeamLogo imageId={ev.away?.image_id} name={awayName} size={22} />
          <span className="card-team-name">{awayName}</span>
          {score.away !== null && (
            <span className={`card-team-score${isLive ? ' score-live' : ''}`}>
              {score.away}
            </span>
          )}
        </div>
      </div>

      {/* ── Posse de bola (futebol ao vivo) ── */}
      {isSoccer && isLive && <PossessionBar stats={ev.stats} />}

      {/* ── Rodapé: data + IA ── */}
      <div className="card-footer">
        <span className="card-date">{dateStr || ''}</span>
        {showAIBtn && (
          <button
            className="card-ai-btn"
            onClick={e => { e.stopPropagation(); onAIClick?.(); }}
          >
            ✦ Análise IA
          </button>
        )}
      </div>
    </div>
  );
}
