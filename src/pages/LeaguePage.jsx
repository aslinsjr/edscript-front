import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSportBySlug } from '../constants/sports.js';
import { fetchEvents } from '../api/client.js';
import { isEsoccer } from '../utils/sport.js';
import { LeagueLogo } from '../components/TeamLogo.jsx';
import './LeaguePage.css';

const CC_NAMES = {
  br: 'Brasil', us: 'Estados Unidos', gb: 'Inglaterra', es: 'Espanha',
  de: 'Alemanha', fr: 'França', it: 'Itália', pt: 'Portugal',
  nl: 'Holanda', be: 'Bélgica', ar: 'Argentina', mx: 'México',
  tr: 'Turquia', ru: 'Rússia', jp: 'Japão', cn: 'China',
  au: 'Austrália', kr: 'Coreia do Sul', sa: 'Arábia Saudita',
  ng: 'Nigéria', za: 'África do Sul', eg: 'Egito', ma: 'Marrocos',
  cl: 'Chile', co: 'Colômbia', pe: 'Peru', uy: 'Uruguai',
  at: 'Áustria', ch: 'Suíça', pl: 'Polônia', se: 'Suécia',
  no: 'Noruega', dk: 'Dinamarca', fi: 'Finlândia', cz: 'República Tcheca',
  ro: 'Romênia', hu: 'Hungria', ua: 'Ucrânia', gr: 'Grécia',
  hr: 'Croácia', rs: 'Sérvia', sk: 'Eslováquia', si: 'Eslovênia',
  bg: 'Bulgária', by: 'Bielorrússia', az: 'Azerbaijão', ge: 'Geórgia',
  il: 'Israel', ir: 'Irã', in: 'Índia', pk: 'Paquistão',
  international: 'Internacional', world: 'Mundial',
};

function CountryFlag({ cc }) {
  if (!cc || cc.length !== 2) return <span className="country-flag-fallback">🌐</span>;
  return (
    <img
      className="country-flag-img"
      src={`https://flagcdn.com/w40/${cc.toLowerCase()}.png`}
      alt={cc.toUpperCase()}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function ccName(cc) {
  if (!cc) return 'Outros';
  return CC_NAMES[cc.toLowerCase()] || cc.toUpperCase();
}

function groupByCountry(leagues) {
  const map = new Map();
  for (const l of leagues) {
    const key = l.cc?.toLowerCase() || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(l);
  }
  // ordena países pelo total de eventos (desc)
  return [...map.entries()]
    .map(([cc, items]) => ({ cc, items, total: items.reduce((s, l) => s + l.count, 0) }))
    .sort((a, b) => {
      if (!a.cc && b.cc) return 1;
      if (a.cc && !b.cc) return -1;
      return b.total - a.total;
    });
}

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
  const [collapsed, setCollapsed] = useState(new Set());

  function toggleCountry(cc) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cc) ? next.delete(cc) : next.add(cc);
      return next;
    });
  }

  useEffect(() => {
    if (!sport) return;
    setLoading(true);
    setError(null);

    const isEsports = sport.id === 151;
    const isSoccer  = sport.type === 'soccer';

    const fetches = isEsports
      ? [
          fetchEvents('/api/events/inplay',   { sport_id: 151 }),
          fetchEvents('/api/events/upcoming', { sport_id: 151 }),
          fetchEvents('/api/events/inplay',   { sport_id: 1 }),
          fetchEvents('/api/events/upcoming', { sport_id: 1 }),
        ]
      : [
          fetchEvents('/api/events/inplay',   { sport_id: sport.id }),
          fetchEvents('/api/events/upcoming', { sport_id: sport.id }),
        ];

    Promise.all(fetches)
      .then(results => {
        let allEvents = results.flatMap(toList);

        if (isEsports) {
          // Mantém eventos do sport 151 + apenas esoccer do sport 1
          const from151 = results.slice(0, 2).flatMap(toList);
          const soccer  = results.slice(2, 4).flatMap(toList).filter(isEsoccer);
          allEvents = [...from151, ...soccer];
        } else if (isSoccer) {
          allEvents = allEvents.filter(ev => !isEsoccer(ev));
        }

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
        <div className="leagues-by-country">
          <button className="league-card league-card-all" onClick={() => goToEvents(null)}>
            <div className="league-card-logo-wrap league-card-logo-all">
              <span style={{ fontSize: 28 }}>{sport.emoji}</span>
            </div>
            <div className="league-card-info">
              <span className="league-card-name">Todas as ligas</span>
              <span className="league-card-sub">{leagues.length} ligas disponíveis</span>
            </div>
          </button>

          {leagues.length === 0 && !error && (
            <p className="league-empty">Nenhuma liga encontrada no momento.</p>
          )}

          {groupByCountry(leagues).map(({ cc, items, total }) => {
            const isOpen = !collapsed.has(cc);
            return (
              <div key={cc || '_'} className="country-section">
                <button className="country-header" onClick={() => toggleCountry(cc)}>
                  <CountryFlag cc={cc} />
                  <span className="country-name">{ccName(cc)}</span>
                  <span className="country-meta">{items.length} liga{items.length !== 1 ? 's' : ''} · {total} evento{total !== 1 ? 's' : ''}</span>
                  <span className={`country-chevron${isOpen ? ' open' : ''}`}>›</span>
                </button>
                {isOpen && (
                  <div className="leagues-grid">
                    {items.map(league => (
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
                            {league.count} evento{league.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
