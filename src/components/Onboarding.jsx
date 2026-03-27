import { useState, useEffect, useRef } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './Onboarding.css';

const THEMES      = ['auto', 'dark', 'light'];
const THEME_LABELS = { auto: '🖥 Sistema', dark: '🌙 Escuro', light: '☀️ Claro' };

const LEVELS    = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META = {
  beginner:     { label: '🌱 Simples e direto',  desc: 'Explicações claras, sem termos técnicos' },
  intermediate: { label: '⚡ Contexto tático',   desc: 'Estatísticas, tendências e leitura de jogo' },
  advanced:     { label: '🔬 Análise profunda',  desc: 'Dados avançados, probabilidades e comparativos' },
};

const STEPS = [
  { key: 'sports', question: 'Quais esportes você quer acompanhar?',  hint: 'O assistente vai monitorar jogos e análises desses esportes.' },
  { key: 'level',  question: 'Como prefere receber as análises?' },
  { key: 'theme',  question: 'Qual tema você prefere?' },
];

export default function Onboarding() {
  const { prefs, updatePrefs, completeOnboarding } = usePreferences();

  const [step,      setStep]      = useState(0);
  const [history,   setHistory]   = useState([]);
  const [favorites, setFavorites] = useState(prefs.favoriteSports);
  const [level,     setLevel]     = useState(prefs.knowledgeLevel);
  const [theme,     setTheme]     = useState(prefs.theme);

  const originalTheme = useRef(prefs.theme);
  const bodyRef       = useRef(null);

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
        const sel = SPORTS.filter(s => favorites.includes(s.id));
        return sel.length === SPORTS.length ? 'Todos os esportes' : sel.map(s => s.emoji).join(' ');
      }
      case 'level': return LEVEL_META[level].label;
      case 'theme': return THEME_LABELS[theme];
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
        knowledgeLevel:    level,
        theme,
        defaultMode:       'inplay',
        defaultTab:        'ai',
        showAIButton:      true,
        showPossessionBar: true,
        showStatsPreview:  true,
      });
    }
  }

  function handleThemeChange(th) {
    setTheme(th);
    updatePrefs({ theme: th });
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
            <span className="onboard-bot-status">configuração do assistente</span>
          </div>
          <div className="onboard-progress-pill">{step + 1} / {STEPS.length}</div>
        </div>

        {/* Chat body */}
        <div className="onboard-chat-body" ref={bodyRef}>

          <div className="onboard-bubble bot intro">
            Vou configurar seu assistente pessoal de análises esportivas. São só {STEPS.length} perguntas rápidas.
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

          {current.key === 'theme' && (
            <div className="onboard-seg">
              {THEMES.map(th => (
                <button
                  key={th}
                  className={`onboard-seg-btn${theme === th ? ' active' : ''}`}
                  onClick={() => handleThemeChange(th)}
                >
                  {THEME_LABELS[th]}
                </button>
              ))}
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
