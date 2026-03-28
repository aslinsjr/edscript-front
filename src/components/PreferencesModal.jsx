import { useState, useEffect, useRef } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './PreferencesModal.css';

const THEMES       = ['auto', 'dark', 'light'];
const THEME_LABELS = { auto: '🖥 Sistema', dark: '🌙 Escuro', light: '☀️ Claro' };
const LEVELS       = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META   = {
  beginner:     { label: '🌱 Simples e direto',  desc: 'Explicações claras, sem termos técnicos' },
  intermediate: { label: '⚡ Contexto tático',   desc: 'Estatísticas, tendências e leitura de jogo' },
  advanced:     { label: '🔬 Análise profunda',  desc: 'Dados avançados, probabilidades e comparativos' },
};

const GROUPS = [
  { key: 'sports',    icon: '🏅', label: 'Esportes' },
  { key: 'assistant', icon: '✦',  label: 'Assistente' },
];

export default function PreferencesModal({ onClose }) {
  const { prefs, updatePrefs } = usePreferences();

  const [group,     setGroup]     = useState('sports');
  const [favorites, setFavorites] = useState(prefs.favoriteSports);
  const [theme,     setTheme]     = useState(prefs.theme);
  const [level,     setLevel]     = useState(prefs.knowledgeLevel);

  const originalTheme = useRef(prefs.theme);
  const savedRef      = useRef(false);

  const currentIdx = GROUPS.findIndex(g => g.key === group);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggleSport(id) {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev
        : [...prev, id]
    );
  }

  function handleThemeChange(th) {
    setTheme(th);
    updatePrefs({ theme: th });
  }

  function handleClose() {
    if (!savedRef.current) {
      updatePrefs({ theme: originalTheme.current });
    }
    onClose();
  }

  function save() {
    savedRef.current = true;
    updatePrefs({
      favoriteSports: favorites,
      theme,
      knowledgeLevel: level,
    });
    onClose();
  }

  const isLast  = currentIdx === GROUPS.length - 1;
  const isFirst = currentIdx === 0;

  function next() { if (!isLast)  setGroup(GROUPS[currentIdx + 1].key); }
  function prev() { if (!isFirst) setGroup(GROUPS[currentIdx - 1].key); }

  return (
    <div className="pref-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="pref-modal">

        {/* Header */}
        <div className="pref-header">
          <span className="pref-title">⚙️ Preferências</span>
          <button className="pref-close" onClick={handleClose}>✕</button>
        </div>

        {/* Group tabs */}
        <div className="pref-groups">
          {GROUPS.map((g, i) => (
            <button
              key={g.key}
              className={`pref-group-tab${group === g.key ? ' active' : ''}`}
              onClick={() => setGroup(g.key)}
            >
              <span className="pref-group-dot">{i < currentIdx ? '✓' : i + 1}</span>
              <span className="pref-group-icon">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="pref-body">

          {/* ── Esportes ── */}
          {group === 'sports' && (
            <div className="pref-slide">
              <div className="pref-slide-title">Esportes favoritos</div>
              <p className="pref-slide-sub">Apenas os selecionados aparecerão na sidebar e no assistente.</p>
              <div className="pref-select-all-row">
                <button
                  className="pref-link-btn"
                  onClick={() =>
                    favorites.length === SPORTS.length
                      ? setFavorites([SPORTS[0].id])
                      : setFavorites(SPORTS.map(s => s.id))
                  }
                >
                  {favorites.length === SPORTS.length ? 'Limpar tudo' : 'Selecionar tudo'}
                </button>
                <span className="pref-count">{favorites.length} selecionado{favorites.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="pref-sports-grid">
                {SPORTS.map(sport => {
                  const active = favorites.includes(sport.id);
                  return (
                    <button
                      key={sport.id}
                      className={`pref-sport-btn${active ? ' active' : ''}`}
                      onClick={() => toggleSport(sport.id)}
                    >
                      <span>{sport.emoji}</span>
                      <span className="pref-sport-name">{sport.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Assistente ── */}
          {group === 'assistant' && (
            <div className="pref-slide">
              <div className="pref-slide-title">Assistente IA</div>
              <p className="pref-slide-sub">Configure como o assistente se comunica com você.</p>

              <div className="pref-field">
                <label className="pref-label">Nível de análise</label>
                <div className="pref-levels">
                  {LEVELS.map(l => (
                    <button key={l} className={`pref-level-btn${level === l ? ' active' : ''}`} onClick={() => setLevel(l)}>
                      <span className="pref-level-label">{LEVEL_META[l].label}</span>
                      <span className="pref-level-desc">{LEVEL_META[l].desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-field">
                <label className="pref-label">Tema</label>
                <div className="pref-seg">
                  {THEMES.map(th => (
                    <button key={th} className={`pref-seg-btn${theme === th ? ' active' : ''}`} onClick={() => handleThemeChange(th)}>
                      {THEME_LABELS[th]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pref-footer">
          <div className="pref-footer-nav">
            <button className="pref-btn-secondary" onClick={prev} disabled={isFirst}>← Anterior</button>
            <button className="pref-btn-secondary" onClick={next} disabled={isLast}>Próximo →</button>
          </div>
          <button className="pref-btn-primary" onClick={save}>Salvar</button>
        </div>

      </div>
    </div>
  );
}
