import { useState, useEffect, useCallback, useMemo } from 'react';
import './SportPage.css';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSportBySlug } from '../constants/sports.js';
import { fetchEvents } from '../api/client.js';
import { isEsoccer } from '../utils/sport.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { useCurrentEvents } from '../contexts/CurrentEventsContext.jsx';
import EventCard from '../components/EventCard.jsx';
import EventModal from '../components/EventModal.jsx';

const MODES = [
  { key: 'inplay',    label: '🔴 Ao Vivo',    endpoint: '/api/events/inplay' },
  { key: 'upcoming',  label: '🕐 Próximos',   endpoint: '/api/events/upcoming' },
  { key: 'ended',     label: '✓ Encerrados',  endpoint: '/api/events/ended' },
];

export default function SportPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sport = getSportBySlug(slug);

  const { prefs } = usePreferences();
  const { setCurrentEvents, setCurrentMode } = useCurrentEvents();
  const [mode, setMode] = useState(prefs.defaultMode);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [initialTab, setInitialTab] = useState('info');

  // league driven by URL param so deep-links and LeaguePage navigation work
  const selectedLeague = searchParams.get('league') || '';

  function setLeague(id) {
    if (id) setSearchParams({ league: id });
    else setSearchParams({});
  }

  function openEvent(ev, tab = prefs.defaultTab) {
    setInitialTab(tab);
    setSelectedEvent(ev);
  }

  const load = useCallback(async () => {
    if (!sport) return;
    const currentMode = MODES.find(m => m.key === mode);
    setLoading(true);
    setError(null);
    try {
      const isEsports = sport.id === 151;
      const isSoccer  = sport.type === 'soccer';

      let list = [];

      if (isEsports) {
        // E-Sports: busca sport_id=151 + esoccer do sport_id=1 em paralelo
        const [esportsData, soccerData] = await Promise.all([
          fetchEvents(currentMode.endpoint, { sport_id: 151 }),
          fetchEvents(currentMode.endpoint, { sport_id: 1 }),
        ]);
        const esportsList = Array.isArray(esportsData)
          ? esportsData
          : (esportsData.results || esportsData.events || esportsData.data || []);
        const soccerList = Array.isArray(soccerData)
          ? soccerData
          : (soccerData.results || soccerData.events || soccerData.data || []);

        list = [...esportsList, ...soccerList.filter(isEsoccer)];
      } else {
        const data = await fetchEvents(currentMode.endpoint, { sport_id: sport.id });
        list = Array.isArray(data) ? data : (data.results || data.events || data.data || []);
        // Futebol/Futsal: remove esoccer (pertencem a E-Sports)
        if (isSoccer) list = list.filter(ev => !isEsoccer(ev));
      }

      setAllEvents(list);
      setCurrentMode(mode);
    } catch (err) {
      setError(err.message);
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, [sport, mode]);

  useEffect(() => {
    setAllEvents([]);
    load();
  }, [load]);

  // limpa o contexto ao sair da página
  useEffect(() => {
    return () => { setCurrentEvents(null); setCurrentMode(null); };
  }, []);

  const leagues = useMemo(() => {
    const map = new Map();
    for (const ev of allEvents) {
      if (ev.league?.id && !map.has(ev.league.id)) {
        map.set(ev.league.id, { id: ev.league.id, name: ev.league.name || '—' });
      }
    }
    return [...map.values()];
  }, [allEvents]);

  const events = useMemo(() => (
    selectedLeague
      ? allEvents.filter(ev => String(ev.league?.id) === selectedLeague)
      : allEvents
  ), [allEvents, selectedLeague]);

  useEffect(() => {
    setCurrentEvents(events);
  }, [events]);

  if (!sport) {
    return (
      <div className="not-found">
        <h2>Esporte não encontrado</h2>
        <p>O esporte "{slug}" não existe nesta aplicação.</p>
        <button className="mode-tab" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          ← Voltar ao início
        </button>
      </div>
    );
  }

  const currentModeLabel = MODES.find(m => m.key === mode)?.label || '';

  return (
    <div className="sport-page">
      <div className="sport-page-header">
        <div className="sport-page-title-row">
          <span style={{ fontSize: 28 }}>{sport.emoji}</span>
          <h2>{sport.name}</h2>
        </div>
        <div className="sport-page-controls">
          <div className="mode-tabs">
            {MODES.map(m => (
              <button
                key={m.key}
                className={'mode-tab' + (mode === m.key ? ' active' : '')}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {leagues.length > 1 && (
            <div className="league-select-row">
              <button className="back-btn" onClick={() => navigate(`/sport/${slug}`)}>←</button>
              <select
                className="league-select"
                value={selectedLeague}
                onChange={e => setLeague(e.target.value)}
              >
                <option value="">Todas as ligas</option>
                {leagues.map(l => (
                  <option key={l.id} value={String(l.id)}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          Erro ao carregar eventos: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="results-info">
          <span className="info-chip">
            <strong>{events.length}</strong> evento{events.length !== 1 ? 's' : ''} — {currentModeLabel}
          </span>
          <span className="info-chip">
            {sport.emoji} <strong>{sport.name}</strong>
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Carregando eventos...</span>
        </div>
      ) : events.length === 0 && !error ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>{sport.emoji}</div>
          <p>Nenhum evento encontrado para este modo.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
            <EventCard
              key={ev.id}
              ev={ev}
              sportType={sport.type}
              onClick={() => openEvent(ev)}
              onAIClick={() => openEvent(ev, 'ai')}
            />
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventModal
          ev={selectedEvent}
          sport={sport}
          initialTab={initialTab}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
