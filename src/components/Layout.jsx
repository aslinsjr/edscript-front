import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { fetchEvents } from '../api/client.js';
import { isEsoccer } from '../utils/sport.js';

// ─── helpers de país ───────────────────────────────────────────────────────

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

function ccName(cc) {
  if (!cc) return 'Outros';
  return CC_NAMES[cc.toLowerCase()] || cc.toUpperCase();
}

function CountryFlag({ cc }) {
  if (!cc || cc.length !== 2) return null;
  return (
    <img
      className="sb-flag"
      src={`https://flagcdn.com/w20/${cc.toLowerCase()}.png`}
      alt={cc.toUpperCase()}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function groupByCountry(leagues) {
  const map = new Map();
  for (const l of leagues) {
    const key = l.cc?.toLowerCase() || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(l);
  }
  return [...map.entries()]
    .map(([cc, items]) => ({ cc, items, total: items.reduce((s, l) => s + l.count, 0) }))
    .sort((a, b) => {
      if (!a.cc && b.cc) return 1;
      if (a.cc && !b.cc) return -1;
      return b.total - a.total;
    });
}

// ─── item de esporte na sidebar ────────────────────────────────────────────

function SidebarSportItem({ sport, closeSidebar, defaultExpanded = false }) {
  const navigate = useNavigate();
  const [expanded, setExpanded]           = useState(defaultExpanded);
  const [countries, setCountries]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [openCountries, setOpenCountries] = useState(new Set());

  // carrega ligas imediatamente se aberto por padrão
  useEffect(() => { if (defaultExpanded) loadLeagues(); }, []);

  async function loadLeagues() {
    setLoading(true);
    try {
      const [inplay, upcoming] = await Promise.all([
        fetchEvents('/api/events/inplay',   { sport_id: sport.id }),
        fetchEvents('/api/events/upcoming', { sport_id: sport.id }),
      ]);
      const toList = d => Array.isArray(d) ? d : (d?.results || d?.events || d?.data || []);
      let all = [...toList(inplay), ...toList(upcoming)];
      if (sport.type === 'soccer') all = all.filter(ev => !isEsoccer(ev));

      const leagueMap = new Map();
      for (const ev of all) {
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
      setCountries(groupByCountry([...leagueMap.values()].sort((a, b) => b.count - a.count)));
    } catch {
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!expanded && countries === null) loadLeagues();
    setExpanded(v => !v);
  }

  function toggleCountry(cc) {
    setOpenCountries(prev => {
      const next = new Set(prev);
      next.has(cc) ? next.delete(cc) : next.add(cc);
      return next;
    });
  }

  return (
    <div className="sb-sport-item">
      <button className={`sb-sport-row${expanded ? ' expanded' : ''}`} onClick={toggleExpand}>
        <span className="sport-emoji">{sport.emoji}</span>
        <span className="sb-sport-name">{sport.name}</span>
        <span className={`sb-chevron${expanded ? ' open' : ''}`}>›</span>
      </button>

      {expanded && (
        <div className="sb-countries">
          <button
            className="sb-league-btn sb-all-btn"
            onClick={() => { navigate(`/sport/${sport.slug}/events`); closeSidebar(); }}
          >
            {sport.emoji} Todos os eventos
          </button>

          {loading && <div className="sb-loading"><div className="spinner-sm" />Carregando...</div>}

          {countries?.length === 0 && !loading && (
            <div className="sb-empty">Sem ligas no momento</div>
          )}

          {countries?.map(({ cc, items }) => {
            const isOpen = openCountries.has(cc);
            return (
              <div key={cc || '_'} className="sb-country-item">
                <button className="sb-country-row" onClick={() => toggleCountry(cc)}>
                  <CountryFlag cc={cc} />
                  <span className="sb-country-name">{ccName(cc)}</span>
                  <span className={`sb-chevron-sm${isOpen ? ' open' : ''}`}>›</span>
                </button>

                {isOpen && (
                  <div className="sb-leagues">
                    {items.map(l => (
                      <button
                        key={l.id}
                        className="sb-league-btn"
                        onClick={() => {
                          navigate(`/sport/${sport.slug}/events?league=${l.id}`);
                          closeSidebar();
                        }}
                      >
                        {l.name}
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

// ─── layout principal ──────────────────────────────────────────────────────

export default function Layout() {
  const { prefs } = usePreferences();
  const visibleSports = SPORTS.filter(s => prefs.favoriteSports.includes(s.id));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function close() { setSidebarOpen(false); }

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={close} />}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink to="/" className="sidebar-brand" onClick={close}>
            <img src="/icon-dark.png"  alt="" className="sidebar-icon sidebar-icon--dark" />
            <img src="/icon-light.png" alt="" className="sidebar-icon sidebar-icon--light" />
            <img src="/logo.png"       alt="Sportlyzer" className="sidebar-logo sidebar-logo--dark" />
            <img src="/logo-light.png" alt="Sportlyzer" className="sidebar-logo sidebar-logo--light" />
          </NavLink>
          <button className="sidebar-close-btn" onClick={close} aria-label="Fechar menu">✕</button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            onClick={close}
          >
            <span className="sport-emoji">🏠</span>Início
          </NavLink>

          {visibleSports.map((sport, i) => (
            <SidebarSportItem key={sport.id} sport={sport} closeSidebar={close} defaultExpanded={i === 0} />
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            ☰
          </button>
          <NavLink to="/" className="mobile-brand">
            <img src="/logo.png"       alt="Sportlyzer" className="mobile-brand-logo mobile-brand-logo--dark" />
            <img src="/logo-light.png" alt="Sportlyzer" className="mobile-brand-logo mobile-brand-logo--light" />
          </NavLink>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
