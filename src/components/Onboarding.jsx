import { useState } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './Onboarding.css';

const STEPS = ['Esportes', 'Preferências', 'Cards'];

const MODES   = ['inplay', 'upcoming', 'ended'];
const MODE_LABELS = { inplay: '🔴 Ao Vivo', upcoming: '🕐 Próximos', ended: '✓ Encerrados' };

const TABS    = ['info', 'ai'];
const TAB_LABELS = { info: 'Informações', ai: '✦ Análise IA' };

const THEMES  = ['auto', 'dark', 'light'];
const THEME_LABELS = { auto: '🖥 Sistema', dark: '🌙 Escuro', light: '☀️ Claro' };

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META = {
  beginner:     { label: '🌱 Iniciante',     desc: 'Explicações simples, sem jargões' },
  intermediate: { label: '⚡ Intermediário', desc: 'Contexto tático e estatístico' },
  advanced:     { label: '🔬 Avançado',      desc: 'Análises detalhadas e técnicas' },
};

export default function Onboarding() {
  const { prefs, completeOnboarding } = usePreferences();

  const [step, setStep]     = useState(0);
  const [favorites, setFavorites] = useState(prefs.favoriteSports);
  const [defaultMode, setDefaultMode] = useState(prefs.defaultMode);
  const [defaultTab,  setDefaultTab]  = useState(prefs.defaultTab);
  const [theme,       setTheme]       = useState(prefs.theme);
  const [level,       setLevel]       = useState(prefs.knowledgeLevel);
  const [showAI,      setShowAI]      = useState(prefs.showAIButton);
  const [showPoss,    setShowPoss]    = useState(prefs.showPossessionBar);
  const [showStats,   setShowStats]   = useState(prefs.showStatsPreview);

  function toggleSport(id) {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev
        : [...prev, id]
    );
  }

  function finish() {
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

  return (
    <div className="onboard-overlay">
      <div className="onboard-modal">

        {/* Header */}
        <div className="onboard-header">
          <div className="onboard-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`onboard-step${i === step ? ' active' : i < step ? ' done' : ''}`}>
                <div className="onboard-step-dot">{i < step ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="onboard-body">

          {/* ── Step 0: Sports ── */}
          {step === 0 && (
            <>
              <div className="onboard-title-row">
                <h2 className="onboard-title">Quais esportes você acompanha?</h2>
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
              <p className="onboard-sub">Selecione pelo menos um. Você pode alterar depois.</p>
              <div className="onboard-sports-grid">
                {SPORTS.map(sport => {
                  const active = favorites.includes(sport.id);
                  return (
                    <button
                      key={sport.id}
                      className={`onboard-sport-btn${active ? ' active' : ''}`}
                      onClick={() => toggleSport(sport.id)}
                    >
                      <span className="onboard-sport-emoji">{sport.emoji}</span>
                      <span className="onboard-sport-name">{sport.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Step 1: Preferences ── */}
          {step === 1 && (
            <>
              <h2 className="onboard-title">Como você prefere navegar?</h2>
              <p className="onboard-sub">Configure o comportamento padrão da plataforma.</p>

              <div className="onboard-fields">
                <div className="onboard-field">
                  <label className="onboard-label">Modo padrão ao entrar em um esporte</label>
                  <div className="onboard-seg">
                    {MODES.map(m => (
                      <button
                        key={m}
                        className={`onboard-seg-btn${defaultMode === m ? ' active' : ''}`}
                        onClick={() => setDefaultMode(m)}
                      >
                        {MODE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="onboard-field">
                  <label className="onboard-label">Abrir evento direto em</label>
                  <div className="onboard-seg">
                    {TABS.map(t => (
                      <button
                        key={t}
                        className={`onboard-seg-btn${defaultTab === t ? ' active' : ''}`}
                        onClick={() => setDefaultTab(t)}
                      >
                        {TAB_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="onboard-field">
                  <label className="onboard-label">Seu nível de conhecimento esportivo</label>
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
                </div>

                <div className="onboard-field">
                  <label className="onboard-label">Tema</label>
                  <div className="onboard-seg">
                    {THEMES.map(th => (
                      <button
                        key={th}
                        className={`onboard-seg-btn${theme === th ? ' active' : ''}`}
                        onClick={() => setTheme(th)}
                      >
                        {THEME_LABELS[th]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Cards ── */}
          {step === 2 && (
            <>
              <h2 className="onboard-title">O que exibir nos cards?</h2>
              <p className="onboard-sub">Personalize as informações visíveis em cada evento.</p>

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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="onboard-footer">
          {step > 0 && (
            <button className="onboard-btn-secondary" onClick={() => setStep(s => s - 1)}>
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="onboard-btn-primary" onClick={() => setStep(s => s + 1)}>
              Continuar
            </button>
          ) : (
            <button className="onboard-btn-primary" onClick={finish}>
              Começar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
