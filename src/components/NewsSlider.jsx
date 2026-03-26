import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNews } from '../api/client.js';
import { SPORTS } from '../constants/sports.js';
import { useResolvedTheme } from '../hooks/useResolvedTheme.js';
import './NewsSlider.css';

const INTERVAL = 6000;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'agora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NewsSlider({ favoriteSportIds, searchBar }) {
  const navigate = useNavigate();
  const theme    = useResolvedTheme();
  const [news, setNews]       = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused]   = useState(false);
  const timerRef = useRef(null);

  const icon = theme === 'light' ? '/icon-light.png' : '/icon-dark.png';
  const logo = theme === 'light' ? '/logo-light.png' : '/logo.png';

  const slugs = SPORTS
    .filter(s => favoriteSportIds.includes(s.id))
    .map(s => s.slug)
    .slice(0, 5);

  const favoriteSports = SPORTS.filter(s => favoriteSportIds.includes(s.id));

  useEffect(() => {
    if (slugs.length === 0) return;
    setLoading(true);
    fetchNews(slugs)
      .then(d => {
        const articles = d?.results || d?.data || d?.articles || [];
        const withImage = (Array.isArray(articles) ? articles : [])
          .filter(a => a.image_url || a.urlToImage || a.image);
        setNews(withImage);
        setCurrent(0);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [favoriteSportIds.join(',')]);

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(news.length, 1)), [news.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + news.length) % Math.max(news.length, 1)), [news.length]);

  useEffect(() => {
    if (paused || news.length <= 1) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [news.length, paused, next]);

  if (loading) {
    return (
      <div className="news-slider news-slider-loading">
        <div className="spinner" />
        <span>Carregando notícias...</span>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="news-slider news-slider-empty">
        <span>Sem notícias no momento.</span>
      </div>
    );
  }

  const article = news[current];
  const image   = article.image_url || article.urlToImage || article.image;
  const title   = article.title || '—';
  const desc    = article.description || article.content || '';
  const source  = article.source_id || article.source?.name || '';
  const pubDate = article.pubDate || article.publishedAt || '';
  const url     = article.link || article.url || '#';

  return (
    <div
      className="news-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* imagem restrita à área visível (abaixo do header, à direita do painel) */}
      <div className="news-slide-bg" style={{ backgroundImage: `url(${image})` }} />

      {/* único elemento com backdrop-filter em forma de L invertido */}
      <div className="news-l-bg" />

      {/* brand bar — sem background, visual vem do news-l-bg */}
      <div className="news-panel-brand">
        <img src={icon} alt="" className="news-panel-icon" />
        <img src={logo} alt="Sportlyzer" className="news-panel-logo" />
      </div>

      {/* painel esquerdo — sem background, visual vem do news-l-bg */}
      <div className="news-sports-panel">
        <div className="news-panel-body">
          <span className="news-sports-label">Modalidades</span>
          <ul className="news-sports-list">
            {favoriteSports.map(s => (
              <li key={s.id}>
                <button
                  className="news-sport-btn"
                  onClick={() => navigate(`/sport/${s.slug}`)}
                >
                  <span className="news-sport-emoji">{s.emoji}</span>
                  <span className="news-sport-name">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>

          {searchBar && (
            <div className="news-panel-search">
              {searchBar}
            </div>
          )}
        </div>
      </div>


      {/* lado direito — conteúdo da notícia */}
      <a className="news-slide" href={url} target="_blank" rel="noopener noreferrer">
        <div className="news-slide-content">
          <div className="news-slide-meta">
            {source && <span className="news-source">{source}</span>}
            {pubDate && <span className="news-time">{timeAgo(pubDate)}</span>}
          </div>
          <h3 className="news-slide-title">{title}</h3>
          {desc && <p className="news-slide-desc">{desc}</p>}
        </div>
      </a>

      {/* controles */}
      <div className="news-controls">
        <button className="news-arrow" onClick={e => { e.preventDefault(); prev(); }}>‹</button>
        <div className="news-dots">
          {news.map((_, i) => (
            <button
              key={i}
              className={`news-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
        <button className="news-arrow" onClick={e => { e.preventDefault(); next(); }}>›</button>
      </div>
    </div>
  );
}
