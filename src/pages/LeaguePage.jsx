import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSportBySlug } from '../constants/sports.js';
import { fetchEvents } from '../api/client.js';
import { LeagueLogo } from '../components/TeamLogo.jsx';
import './LeaguePage.css';

function toList(d) {
  return Array.isArray(d) ? d : (d?.results || d?.events || d?.data || []);
}

export default function LeaguePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const sport = getSportBySlug(slug);

  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sport) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchEvents('/api/events/inplay', { sport_id: sport.id }),
      fetchEvents('/api/events/upcoming', { sport_id: sport.id }),
    ])
      .then(([inplay, upcoming]) => {
        const allEvents = [...toList(inplay), ...toList(upcoming)];
        const leagueMap = new Map();

        for (const ev of allEvents) {
          if (!ev.league?.id) continue;
          if (!leagueMap.has(ev.league.id)) {
            leagueMap.set(ev.league.id, {
              id: ev.league.id,
              name: ev.league.name || '—',
              cc: ev.league.cc || null,
              count: 0,
            });
          }
          leagueMap.get(ev.league.id).count++;
        }

        setLeagues([...leagueMap.values()].sort((a, b) => b.count - a.count));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [sport]);

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

  function goToEvents(leagueId) {
    const base = `/sport/${slug}/events`;
    navigate(leagueId ? `${base}?league=${leagueId}` : base);
  }

  return (
    <div className="league-page">
      <div className="league-page-header">
        <div className="league-page-title">
          <span className="league-page-emoji">{sport.emoji}</span>
          <h2>{sport.name}</h2>
        </div>
        <p className="league-page-subtitle">Selecione uma liga para ver os eventos</p>
      </div>

      {error && <div className="error-banner">Erro ao carregar ligas: {error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Carregando ligas...</span>
        </div>
      ) : (
        <div className="leagues-grid">
          <button className="league-card league-card-all" onClick={() => goToEvents(null)}>
            <div className="league-card-logo-wrap league-card-logo-all">
              <span style={{ fontSize: 28 }}>{sport.emoji}</span>
            </div>
            <div className="league-card-info">
              <span className="league-card-name">Todas as ligas</span>
              <span className="league-card-sub">{leagues.length} ligas disponíveis</span>
            </div>
          </button>

          {leagues.map(league => (
            <button
              key={league.id}
              className="league-card"
              onClick={() => goToEvents(league.id)}
            >
              <div className="league-card-logo-wrap">
                <LeagueLogo leagueId={league.id} name={league.name} cc={league.cc} size={32} />
              </div>
              <div className="league-card-info">
                <span className="league-card-name">{league.name}</span>
                <span className="league-card-sub">
                  {league.cc && <span className="league-card-cc">{league.cc.toUpperCase()}</span>}
                  {league.count} evento{league.count !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}

          {leagues.length === 0 && !error && (
            <p className="league-empty">Nenhuma liga encontrada no momento.</p>
          )}
        </div>
      )}
    </div>
  );
}
