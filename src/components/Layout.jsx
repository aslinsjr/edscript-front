import { NavLink, Outlet } from 'react-router-dom';
import { SPORTS } from '../constants/sports.js';

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ Sports Explorer</div>
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
