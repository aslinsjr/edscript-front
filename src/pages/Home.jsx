import { useNavigate } from 'react-router-dom';
import { SPORTS } from '../constants/sports.js';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>⚡ Sports Explorer</h1>
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
