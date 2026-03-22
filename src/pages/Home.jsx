import { useNavigate } from 'react-router-dom';
import { SPORTS } from '../constants/sports.js';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-brand">
          <picture>
            <source srcSet="/icon-light.png" media="(prefers-color-scheme: light)" />
            <img src="/icon-dark.png" alt="" className="home-brand-icon" />
          </picture>
          <picture>
            <source srcSet="/logo-light.png" media="(prefers-color-scheme: light)" />
            <img src="/logo.png" alt="Sports Explorer" className="home-brand-logo" />
          </picture>
        </div>
        <p>Explore eventos esportivos ao vivo, próximos e encerrados de todo o mundo.</p>
      </div>
      <div className="sports-grid">
        {SPORTS.map(sport => (
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
