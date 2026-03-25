import { useState, useEffect } from 'react';
import { fetchEvents } from '../api/client.js';
import { SPORTS } from '../constants/sports.js';
import { isEsoccer } from '../utils/sport.js';
import { TeamLogo } from './TeamLogo.jsx';
import './RecentResults.css';

const SOCCER_ID = 1;

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function ResultRow({ ev, sport, onSelect }) {
  const home = ev.home?.name || '—';
  const away = ev.away?.name || '—';
  const ss   = ev.ss || null;
  let homeScore = null, awayScore = null;
  if (ss) { const p = ss.split('-'); homeScore = p[0]; awayScore = p[1]; }
  const dateStr = formatDate(ev.time);

  return (
    <button className="rr-row" onClick={() => onSelect(ev, sport)}>
      <div className="rr-league">{ev.league?.name || sport?.name || '—'}</div>
      <div className="rr-matchup">
        <div className="rr-team">
          <TeamLogo imageId={ev.home?.image_id} name={home} size={18} />
          <span className="rr-team-name">{home}</span>
        </div>
        {ss ? (
          <div className="rr-score">
            <span className="rr-score-home">{homeScore}</span>
            <span className="rr-score-sep">–</span>
            <span className="rr-score-away">{awayScore}</span>
          </div>
        ) : (
          <span className="rr-score-empty">× </span>
        )}
        <div className="rr-team rr-team-away">
          <span className="rr-team-name rr-away-name">{away}</span>
          <TeamLogo imageId={ev.away?.image_id} name={away} size={18} />
        </div>
      </div>
      {dateStr && <div className="rr-date">{dateStr}</div>}
    </button>
  );
}

export default function RecentResults({ favoriteSports, onEventSelect }) {
  const [sportId,  setSportId]  = useState(SOCCER_ID);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(false);

  const availableSports = SPORTS.filter(s =>
    favoriteSports.includes(s.id) && s.type !== 'racing'
  );
  const currentSport = SPORTS.find(s => s.id === sportId) || availableSports[0];

  useEffect(() => {
    if (!currentSport) return;
    let cancelled = false;
    setLoading(true);
    fetchEvents('/api/events/ended', { sport_id: currentSport.id })
      .then(data => {
        if (cancelled) return;
        let list = Array.isArray(data) ? data : (data.results || data.events || data.data || []);
        if (currentSport.type === 'soccer') list = list.filter(ev => !isEsoccer(ev));
        setEvents(list.slice(0, 10));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setEvents([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [sportId]);

  if (availableSports.length === 0) return null;

  return (
    <div className="rr-section">
      <div className="rr-header">
        <span className="rr-title">Resultados Recentes</span>
        <div className="rr-sport-tabs">
          {availableSports.slice(0, 6).map(s => (
            <button
              key={s.id}
              className={`rr-sport-btn${s.id === sportId ? ' active' : ''}`}
              onClick={() => setSportId(s.id)}
              title={s.name}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rr-loading">
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <p className="rr-empty">Nenhum resultado recente disponível.</p>
      ) : (
        <div className="rr-list">
          {events.map(ev => (
            <ResultRow
              key={ev.id}
              ev={ev}
              sport={currentSport}
              onSelect={onEventSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
