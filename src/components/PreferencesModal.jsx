import { useState, useEffect, useRef } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './PreferencesModal.css';

const MODES        = ['inplay', 'upcoming', 'ended'];
const MODE_LABELS  = { inplay: '🔴 Ao Vivo', upcoming: '🕐 Próximos', ended: '✓ Encerrados' };
const TABS         = ['info', 'ai'];
const TAB_LABELS   = { info: 'Informações', ai: '✦ Análise IA' };
const THEMES       = ['auto', 'dark', 'light'];
const THEME_LABELS = { auto: '🖥 Sistema', dark: '🌙 Escuro', light: '☀️ Claro' };
const LEVELS       = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META   = {
  beginner:     { label: '🌱 Simples e direto',  desc: 'Explicações claras, sem termos técnicos' },
  intermediate: { label: '⚡ Contexto tático',   desc: 'Estatísticas, tendências e leitura de jogo' },
  advanced:     { label: '🔬 Análise profunda',  desc: 'Dados avançados, probabilidades e comparativos' },
};

const GROUPS = [
  { key: 'sports',     icon: '🏅', label: 'Esportes' },
  { key: 'navigation', icon: '🧭', label: 'Navegação' },
  { key: 'cards',      icon: '🃏', label: 'Cards' },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="pref-toggle-wrap">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </label>
  );
}

export default function PreferencesModal({ onClose }) {
  const { prefs, updatePrefs } = usePreferences();

  const [group,       setGroup]       = useState('sports');
  const [favorites,   setFavorites]   = useState(prefs.favoriteSports);
  const [defaultMode, setDefaultMode] = useState(prefs.defaultMode);
  const [defaultTab,  setDefaultTab]  = useState(prefs.defaultTab);
  const [theme,       setTheme]       = useState(prefs.theme);
  const [level,       setLevel]       = useState(prefs.knowledgeLevel);
  const [showAI,      setShowAI]      = useState(prefs.showAIButton);
  const [showPoss,    setShowPoss]    = useState(prefs.showPossessionBar);
  const [showStats,   setShowStats]   = useState(prefs.showStatsPreview);

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
    updatePrefs({ theme: th }); // preview imediato — logo atualiza em tempo real
  }

  function handleClose() {
    if (!savedRef.current) {
      updatePrefs({ theme: originalTheme.current }); // reverte preview se não salvou
    }
    onClose();
  }

  function save() {
    savedRef.current = true;
    updatePrefs({
      favoriteSports:    favorites,
      defaultMode,
      defaultTab,
      theme,
      knowledgeLevel:    level,
      showAIButton:      showAI,
      showPossessionBar: showPoss,
      showStatsPreview:  showStats,
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
              <p className="pref-slide-sub">Apenas os selecionados aparecerão na sidebar e na home.</p>
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

          {/* ── Navegação ── */}
          {group === 'navigation' && (
            <div className="pref-slide">
              <div className="pref-slide-title">Navegação</div>
              <p className="pref-slide-sub">Configure o comportamento padrão da plataforma.</p>

              <div className="pref-field">
                <label className="pref-label">Modo padrão ao entrar em um esporte</label>
                <div className="pref-seg">
                  {MODES.map(m => (
                    <button key={m} className={`pref-seg-btn${defaultMode === m ? ' active' : ''}`} onClick={() => setDefaultMode(m)}>
                      {MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-field">
                <label className="pref-label">Abrir evento direto em</label>
                <div className="pref-seg">
                  {TABS.map(t => (
                    <button key={t} className={`pref-seg-btn${defaultTab === t ? ' active' : ''}`} onClick={() => setDefaultTab(t)}>
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-field">
                <label className="pref-label">Nível de conhecimento esportivo</label>
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

          {/* ── Cards ── */}
          {group === 'cards' && (
            <div className="pref-slide">
              <div className="pref-slide-title">Exibição nos cards</div>
              <p className="pref-slide-sub">Personalize as informações visíveis em cada evento.</p>

              <div className="pref-toggle-row">
                <span>Botão de Análise IA</span>
                <Toggle checked={showAI} onChange={setShowAI} />
              </div>
              <div className="pref-toggle-row">
                <span>Barra de posse de bola (futebol ao vivo)</span>
                <Toggle checked={showPoss} onChange={setShowPoss} />
              </div>
              <div className="pref-toggle-row">
                <span>Prévia de estatísticas</span>
                <Toggle checked={showStats} onChange={setShowStats} />
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
