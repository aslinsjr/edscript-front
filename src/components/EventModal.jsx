import { useEffect, useState } from 'react';
import './EventModal.css';
import { STATUS_MAP } from '../constants/status.js';
import { timerStr } from '../utils/sport.js';
import { TeamLogo } from './TeamLogo.jsx';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import InfoTab     from './modal/InfoTab.jsx';
import StatsTab    from './modal/StatsTab.jsx';
import ScoresTab   from './modal/ScoresTab.jsx';
import OddsTab     from './modal/OddsTab.jsx';
import LineupTab   from './modal/LineupTab.jsx';
import TrendsTab   from './modal/TrendsTab.jsx';
import ForecastTab from './modal/ForecastTab.jsx';
import AITab       from './modal/AITab.jsx';

// ─── link de apostas ──────────────────────────────────────────────────────

const SPORT_URL_SLUG = {
  soccer:           'soccer',
  tennis:           'tennis',
  basketball:       'basketball',
  icehockey:        'ice-hockey',
  handball:         'handball',
  volleyball:       'volleyball',
  tabletennis:      'table-tennis',
  americanfootball: 'american-football',
  rugby:            'rugby-union',
  rugbyleague:      'rugby-league',
  baseball:         'baseball',
  combat:           'mma',
  racing:           'motorsport',
  generic:          'sports',
};

const CC_TO_COUNTRY = {
  br: 'brazil',        us: 'united-states', gb: 'england',
  de: 'germany',       fr: 'france',        es: 'spain',
  it: 'italy',         pt: 'portugal',      ar: 'argentina',
  mx: 'mexico',        nl: 'netherlands',   be: 'belgium',
  tr: 'turkey',        ru: 'russia',        jp: 'japan',
  cn: 'china',         au: 'australia',     kr: 'south-korea',
  sa: 'saudi-arabia',  cl: 'chile',         co: 'colombia',
  uy: 'uruguay',       pe: 'peru',          at: 'austria',
  ch: 'switzerland',   pl: 'poland',        se: 'sweden',
  no: 'norway',        dk: 'denmark',       gr: 'greece',
  ua: 'ukraine',       cz: 'czech-republic',
};

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildBetUrl(ev, sport) {
  const base        = 'https://esportesdasorte.bet.br/ptb/bet/fixture-detail';
  const sportSlug   = SPORT_URL_SLUG[sport.type] || 'sports';
  const cc          = ev.league?.cc?.toLowerCase() || '';
  const countrySlug = CC_TO_COUNTRY[cc] || cc || 'international';
  const leagueSlug  = slugify(ev.league?.name || 'league');
  return `${base}/${sportSlug}/${countrySlug}/${leagueSlug}`;
}

// ─── nível numérico para comparação ──────────────────────────────────────

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

function levelAtLeast(userLevel, minLevel) {
  return LEVEL_RANK[userLevel] >= LEVEL_RANK[minLevel];
}

// ─── definição de todas as abas ───────────────────────────────────────────

const ALL_TABS = [
  { key: 'info',     label: 'Informações' },
  { key: 'stats',    label: 'Estatísticas' },
  { key: 'scores',   label: 'Parciais' },
  { key: 'odds',     label: 'Odds' },
  { key: 'lineup',   label: 'Escalação' },
  { key: 'trends',   label: 'Tendências',  minLevel: 'intermediate' },
  { key: 'forecast', label: '📊 Previsão', minLevel: 'advanced' },
  { key: 'ai',       label: '✦ Análise IA', ai: true },
];

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventModal({ ev, sport, onClose, initialTab = 'info' }) {
  const { prefs } = usePreferences();
  const level = prefs.knowledgeLevel;
  const [tab, setTab] = useState(initialTab);

  const isUpcoming = String(ev.time_status) === '0';
  const isEnded    = !isUpcoming && String(ev.time_status) !== '1';
  const isSoccer   = sport.type === 'soccer';

  const TABS = ALL_TABS.filter(t => {
    if (t.minLevel && !levelAtLeast(level, t.minLevel)) return false;
    if (t.key === 'stats'    && (!isSoccer || isUpcoming))   return false;
    if (t.key === 'scores'   && isUpcoming)                  return false;
    if (t.key === 'odds'     && (isEnded || isUpcoming))      return false;
    if (t.key === 'lineup'   && isUpcoming)                  return false;
    if (t.key === 'trends'   && (!isSoccer || isUpcoming))   return false;
    if (t.key === 'forecast' && (!isSoccer || !isUpcoming))   return false;
    if (t.key === 'ai'       && isEnded)                     return false;
    return true;
  });

  // Se a aba ativa não existir mais (ex: mudança de evento), volta para info
  useEffect(() => {
    if (!TABS.find(t => t.key === tab)) setTab('info');
  }, [TABS, tab]);

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

  let matchupNode;
  if (isRacing) {
    matchupNode = <span>{ev.league?.name || 'Corrida'}</span>;
  } else if (isCombat) {
    matchupNode = (
      <span className="modal-matchup-teams">
        <TeamLogo imageId={ev.home?.image_id} name={ev.home?.name} size={28} />
        {ev.home?.name || 'Lutador A'}
        <span className="modal-matchup-sep">🥊</span>
        <TeamLogo imageId={ev.away?.image_id} name={ev.away?.name} size={28} />
        {ev.away?.name || 'Lutador B'}
      </span>
    );
  } else {
    matchupNode = (
      <span className="modal-matchup-teams">
        <TeamLogo imageId={ev.home?.image_id} name={ev.home?.name} size={28} />
        {ev.home?.name || '—'}
        <span className="modal-matchup-sep">vs</span>
        <TeamLogo imageId={ev.away?.image_id} name={ev.away?.name} size={28} />
        {ev.away?.name || '—'}
      </span>
    );
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
            <div className="modal-matchup">{matchupNode}</div>
            {ev.ss && !isRacing && (
              <div className="modal-score">{ev.ss}</div>
            )}
            {!ev.ss && dateStr && (
              <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{dateStr}</div>
            )}
          </div>
          <div className="modal-header-actions">
            {!isEnded && (
              <a
                className="modal-bet-btn"
                href={buildBetUrl(ev, sport)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apostar
              </a>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
          </div>
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
          {tab === 'info'     && <InfoTab     ev={ev} sport={sport} />}
          {tab === 'stats'    && <StatsTab    ev={ev} sport={sport} />}
          {tab === 'scores'   && <ScoresTab   ev={ev} sport={sport} />}
          {tab === 'odds'     && <OddsTab     ev={ev} level={level} />}
          {tab === 'lineup'   && <LineupTab   ev={ev} level={level} />}
          {tab === 'trends'   && <TrendsTab   ev={ev} level={level} />}
          {tab === 'forecast' && <ForecastTab ev={ev} />}
          {tab === 'ai'       && <AITab       ev={ev} sport={sport} />}
        </div>
      </div>
    </div>
  );
}
