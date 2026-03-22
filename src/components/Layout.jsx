import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { useResolvedTheme } from '../hooks/useResolvedTheme.js';

export default function Layout() {
  const { prefs } = usePreferences();
  const theme = useResolvedTheme();
  const visibleSports = SPORTS.filter(s => prefs.favoriteSports.includes(s.id));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const icon = theme === 'light' ? '/icon-light.png' : '/icon-dark.png';
  const logo = theme === 'light' ? '/logo-light.png' : '/logo.png';

  function close() { setSidebarOpen(false); }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={close} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink to="/" className="sidebar-brand" onClick={close}>
            <img src={icon} alt="" className="sidebar-icon" />
            <img src={logo} alt="Sportlyzer" className="sidebar-logo" />
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
          {visibleSports.map(sport => (
            <NavLink
              key={sport.id}
              to={`/sport/${sport.slug}`}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              onClick={close}
            >
              <span className="sport-emoji">{sport.emoji}</span>{sport.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            ☰
          </button>
          <NavLink to="/" className="mobile-brand">
            <img src={logo} alt="Sportlyzer" className="mobile-brand-logo" />
          </NavLink>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
