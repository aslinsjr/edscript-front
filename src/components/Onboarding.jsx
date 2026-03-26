import { useState, useEffect, useRef } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './Onboarding.css';

const MODES      = ['inplay', 'upcoming', 'ended'];
const MODE_LABELS = { inplay: '🔴 Ao Vivo', upcoming: '🕐 Próximos', ended: '✓ Encerrados' };

const TABS      = ['info', 'ai'];
const TAB_LABELS = { info: 'Informações', ai: '✦ Análise IA' };

const THEMES      = ['auto', 'dark', 'light'];
const THEME_LABELS = { auto: '🖥 Sistema', dark: '🌙 Escuro', light: '☀️ Claro' };

const LEVELS    = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META = {
  beginner:     { label: '🌱 Iniciante',     desc: 'Explicações simples, sem jargões' },
  intermediate: { label: '⚡ Intermediário', desc: 'Contexto tático e estatístico' },
  advanced:     { label: '🔬 Avançado',      desc: 'Análises detalhadas e técnicas' },
};

const STEPS = [
  { key: 'sports', question: 'Quais esportes você acompanha?',           hint: 'Selecione pelo menos um. Pode mudar depois.' },
  { key: 'mode',   question: 'Qual modo prefere ao entrar em um esporte?' },
  { key: 'tab',    question: 'Como prefere abrir um evento?' },
  { key: 'level',  question: 'Qual é o seu nível de conhecimento esportivo?' },
  { key: 'theme',  question: 'Qual tema você prefere?' },
  { key: 'cards',  question: 'O que exibir nos cards de evento?',         hint: 'Você pode ajustar isso depois nas configurações.' },
];

export default function Onboarding() {
  const { prefs, completeOnboarding } = usePreferences();

  const [step,     setStep]     = useState(0);
  const [history,  setHistory]  = useState([]);

  const [favorites,   setFavorites]   = useState(prefs.favoriteSports);
  const [defaultMode, setDefaultMode] = useState(prefs.defaultMode);
  const [defaultTab,  setDefaultTab]  = useState(prefs.defaultTab);
  const [theme,       setTheme]       = useState(prefs.theme);
  const [level,       setLevel]       = useState(prefs.knowledgeLevel);
  const [showAI,      setShowAI]      = useState(prefs.showAIButton);
  const [showPoss,    setShowPoss]    = useState(prefs.showPossessionBar);
  const [showStats,   setShowStats]   = useState(prefs.showStatsPreview);

  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 50);
  }, [history, step]);

  function toggleSport(id) {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev
        : [...prev, id]
    );
  }

  function getAnswer(key) {
    switch (key) {
      case 'sports': {
        const selected = SPORTS.filter(s => favorites.includes(s.id));
        if (selected.length === SPORTS.length) return 'Todos os esportes';
        return selected.map(s => s.emoji).join(' ');
      }
      case 'mode':  return MODE_LABELS[defaultMode];
      case 'tab':   return TAB_LABELS[defaultTab];
      case 'level': return LEVEL_META[level].label;
      case 'theme': return THEME_LABELS[theme];
      case 'cards': {
        const on = [showAI && 'Análise IA', showPoss && 'Posse de bola', showStats && 'Estatísticas'].filter(Boolean);
        return on.length ? on.join(', ') : 'Apenas o básico';
      }
    }
  }

  function advance() {
    const { key } = STEPS[step];
    setHistory(prev => [...prev, { question: STEPS[step].question, answer: getAnswer(key) }]);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      completeOnboarding({
        favoriteSports:    favorites,
        defaultMode,
        defaultTab,
        theme,
        knowledgeLevel:    level,
        showAIButton:      showAI,
        showPossessionBar: showPoss,
        showStatsPreview:  showStats,
      });
    }
  }

  const current    = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="onboard-overlay">
      <div className="onboard-chat-modal">

        {/* Header */}
        <div className="onboard-chat-header">
          <div className="onboard-bot-avatar">✦</div>
          <div className="onboard-bot-info">
            <span className="onboard-bot-name">Sportlyzer</span>
            <span className="onboard-bot-status">configuração inicial</span>
          </div>
          <div className="onboard-progress-pill">{step + 1} / {STEPS.length}</div>
        </div>

        {/* Chat body */}
        <div className="onboard-chat-body" ref={bodyRef}>

          <div className="onboard-bubble bot intro">
            Olá! Vou te ajudar a personalizar sua experiência. São apenas {STEPS.length} perguntas rápidas.
          </div>

          {history.map((h, i) => (
            <div key={i} className="onboard-chat-pair">
              <div className="onboard-bubble bot past">{h.question}</div>
              <div className="onboard-bubble user">{h.answer}</div>
            </div>
          ))}

          <div className="onboard-bubble bot active">
            {current.question}
            {current.hint && <span className="onboard-bubble-hint">{current.hint}</span>}
          </div>

        </div>

        {/* Options */}
        <div className="onboard-chat-options">

          {current.key === 'sports' && (
            <>
              <div className="onboard-options-header">
                <button
                  className="onboard-link-btn"
                  onClick={() =>
                    favorites.length === SPORTS.length
                      ? setFavorites([SPORTS[0].id])
                      : setFavorites(SPORTS.map(s => s.id))
                  }
                >
                  {favorites.length === SPORTS.length ? 'Limpar tudo' : 'Selecionar tudo'}
                </button>
              </div>
              <div className="onboard-sports-grid">
                {SPORTS.map(sport => (
                  <button
                    key={sport.id}
                    className={`onboard-sport-btn${favorites.includes(sport.id) ? ' active' : ''}`}
                    onClick={() => toggleSport(sport.id)}
                  >
                    <span className="onboard-sport-emoji">{sport.emoji}</span>
                    <span className="onboard-sport-name">{sport.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {(current.key === 'mode' || current.key === 'tab' || current.key === 'theme') && (() => {
            const opts    = current.key === 'mode' ? MODES   : current.key === 'tab' ? TABS   : THEMES;
            const labels  = current.key === 'mode' ? MODE_LABELS : current.key === 'tab' ? TAB_LABELS : THEME_LABELS;
            const value   = current.key === 'mode' ? defaultMode : current.key === 'tab' ? defaultTab : theme;
            const setter  = current.key === 'mode' ? setDefaultMode : current.key === 'tab' ? setDefaultTab : setTheme;
            return (
              <div className="onboard-seg">
                {opts.map(opt => (
                  <button
                    key={opt}
                    className={`onboard-seg-btn${value === opt ? ' active' : ''}`}
                    onClick={() => setter(opt)}
                  >
                    {labels[opt]}
                  </button>
                ))}
              </div>
            );
          })()}

          {current.key === 'level' && (
            <div className="onboard-levels">
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`onboard-level-btn${level === l ? ' active' : ''}`}
                  onClick={() => setLevel(l)}
                >
                  <span className="onboard-level-label">{LEVEL_META[l].label}</span>
                  <span className="onboard-level-desc">{LEVEL_META[l].desc}</span>
                </button>
              ))}
            </div>
          )}

          {current.key === 'cards' && (
            <div className="onboard-toggles">
              <label className="onboard-toggle">
                <span>Botão de Análise IA nos cards</span>
                <input type="checkbox" checked={showAI} onChange={e => setShowAI(e.target.checked)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </label>
              <label className="onboard-toggle">
                <span>Barra de posse de bola (futebol ao vivo)</span>
                <input type="checkbox" checked={showPoss} onChange={e => setShowPoss(e.target.checked)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </label>
              <label className="onboard-toggle">
                <span>Prévia de estatísticas nos cards</span>
                <input type="checkbox" checked={showStats} onChange={e => setShowStats(e.target.checked)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </label>
            </div>
          )}

          <div className="onboard-chat-footer">
            <button className="onboard-btn-primary" onClick={advance}>
              {isLastStep ? 'Começar →' : 'Confirmar →'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
