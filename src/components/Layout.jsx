import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';
import { SPORTS } from '../constants/sports.js';

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand">
          <picture>
            <source srcSet="/icon-light.png" media="(prefers-color-scheme: light)" />
            <img src="/icon-dark.png" alt="" className="sidebar-icon" />
          </picture>
          <picture>
            <source srcSet="/logo-light.png" media="(prefers-color-scheme: light)" />
            <img src="/logo.png" alt="Sports Explorer" className="sidebar-logo" />
          </picture>
        </NavLink>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sport-emoji">🏠</span>Início
          </NavLink>
          {SPORTS.map(sport => (
            <NavLink
              key={sport.id}
              to={`/sport/${sport.slug}`}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span className="sport-emoji">{sport.emoji}</span>{sport.name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
