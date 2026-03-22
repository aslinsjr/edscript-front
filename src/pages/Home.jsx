import { useNavigate } from 'react-router-dom';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { useResolvedTheme } from '../hooks/useResolvedTheme.js';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { prefs } = usePreferences();
  const theme = useResolvedTheme();
  const visibleSports = SPORTS.filter(s => prefs.favoriteSports.includes(s.id));

  const icon = theme === 'light' ? '/icon-light.png' : '/icon-dark.png';
  const logo = theme === 'light' ? '/logo-light.png' : '/logo.png';

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-brand">
          <img src={icon} alt="" className="home-brand-icon" />
          <img src={logo} alt="Sportlyzer" className="home-brand-logo" />
        </div>
        <p>Explore eventos esportivos ao vivo, próximos e encerrados de todo o mundo.</p>
      </div>
      <div className="sports-grid">
        {visibleSports.map(sport => (
          <button
            key={sport.id}
            className="sport-card"
            onClick={() => navigate(`/sport/${sport.slug}`)}
          >
            <span className="sport-card-emoji">{sport.emoji}</span>
            <span className="sport-card-name">{sport.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
