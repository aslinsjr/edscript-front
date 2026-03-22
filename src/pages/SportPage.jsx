import { useState, useEffect, useCallback } from 'react';
import './SportPage.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getSportBySlug } from '../constants/sports.js';
import { fetchEvents } from '../api/client.js';
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
  const sport = getSportBySlug(slug);

  const [mode, setMode] = useState('inplay');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [initialTab, setInitialTab] = useState('info');

  function openEvent(ev, tab = 'info') {
    setInitialTab(tab);
    setSelectedEvent(ev);
  }

  const load = useCallback(async () => {
    if (!sport) return;
    const currentMode = MODES.find(m => m.key === mode);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(currentMode.endpoint, { sport_id: sport.id });
      const list = Array.isArray(data) ? data : (data.results || data.events || data.data || []);
      setEvents(list);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [sport, mode]);

  useEffect(() => {
    setEvents([]);
    load();
  }, [load]);

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
        <div className="sport-page-title">
          <span style={{ fontSize: 28 }}>{sport.emoji}</span>
          <h2>{sport.name}</h2>
        </div>
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
