import { useEffect, useState } from 'react';
import { STATUS_MAP } from '../constants/status.js';
import { timerStr } from '../utils/sport.js';
import InfoTab from './modal/InfoTab.jsx';
import StatsTab from './modal/StatsTab.jsx';
import ScoresTab from './modal/ScoresTab.jsx';
import AITab from './modal/AITab.jsx';

const TABS = [
  { key: 'info',   label: 'Informações' },
  { key: 'stats',  label: 'Estatísticas' },
  { key: 'scores', label: 'Parciais' },
  { key: 'ai',     label: '✦ Análise IA', ai: true },
];

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventModal({ ev, sport, onClose }) {
  const [tab, setTab] = useState('info');

  // Escape key + scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const status = STATUS_MAP[String(ev.time_status)] || { label: 'Desconhecido', cls: 'ended' };
  const timer = timerStr(ev, sport.type);
  const dateStr = formatDate(ev.time);

  const isRacing = sport.type === 'racing';
  const isCombat = sport.type === 'combat';

  let matchupText;
  if (isRacing) {
    matchupText = ev.league?.name || 'Corrida';
  } else if (isCombat) {
    matchupText = `${ev.home?.name || 'Lutador A'} 🥊 ${ev.away?.name || 'Lutador B'}`;
  } else {
    matchupText = `${ev.home?.name || '—'} vs ${ev.away?.name || '—'}`;
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">
            <div className="modal-league">
              <span>{sport.emoji} {sport.name}</span>
              {ev.league?.name && !isRacing && (
                <>
                  <span style={{ color: '#484f58' }}>•</span>
                  <span>{ev.league.name}</span>
                </>
              )}
              <span className={`badge badge-${status.cls}`}>{status.label}</span>
              {timer && <span className="badge badge-timer">{timer}</span>}
            </div>
            <div className="modal-matchup">{matchupText}</div>
            {ev.ss && !isRacing && (
              <div className="modal-score">{ev.ss}</div>
            )}
            {!ev.ss && dateStr && (
              <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{dateStr}</div>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="modal-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={'modal-tab' + (tab === t.key ? ' active' : '') + (t.ai ? ' tab-ai' : '')}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'info'   && <InfoTab   ev={ev} sport={sport} />}
          {tab === 'stats'  && <StatsTab  ev={ev} sport={sport} />}
          {tab === 'scores' && <ScoresTab ev={ev} sport={sport} />}
          {tab === 'ai'     && <AITab     ev={ev} sport={sport} />}
        </div>
      </div>
    </div>
  );
}
