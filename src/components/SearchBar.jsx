import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchEvents } from '../api/client.js';
import { SPORTS } from '../constants/sports.js';
import './SearchBar.css';

function getSportById(id) {
  return SPORTS.find(s => s.id === Number(id)) || null;
}

function formatTime(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SearchBar({ onEventSelect }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);

    clearTimeout(timerRef.current);

    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      doSearch(q.trim());
    }, 500);
  }

  async function doSearch(q) {
    setLoading(true);
    setOpen(true);
    try {
      const data = await searchEvents({ home: q });
      const list = Array.isArray(data) ? data : (data.results || data.events || data.data || []);
      setResults(list.slice(0, 15));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(ev) {
    setOpen(false);
    setQuery('');
    setResults([]);
    if (onEventSelect) {
      const sport = getSportById(ev.sport_id);
      onEventSelect(ev, sport);
    }
  }

  return (
    <div className="search-bar-wrapper" ref={ref}>
      <div className="search-bar-input-row">
        <span className="search-icon">🔍</span>
        <input
          className="search-bar-input"
          type="text"
          placeholder="Buscar por time ou evento..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <div className="search-spinner spinner" />}
        {query && !loading && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="search-dropdown">
          {results.length === 0 && !loading && (
            <div className="search-empty">Nenhum evento encontrado para "{query}"</div>
          )}
          {results.map(ev => {
            const sport   = getSportById(ev.sport_id);
            const home    = ev.home?.name || ev.home || '—';
            const away    = ev.away?.name || ev.away || '—';
            const dateStr = formatTime(ev.time);
            return (
              <button key={ev.id} className="search-result-item" onClick={() => handleSelect(ev)}>
                <span className="search-result-sport">{sport?.emoji || '⚽'}</span>
                <div className="search-result-info">
                  <span className="search-result-teams">{home} × {away}</span>
                  {ev.league?.name && (
                    <span className="search-result-league">{ev.league.name}</span>
                  )}
                </div>
                {dateStr && <span className="search-result-date">{dateStr}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
