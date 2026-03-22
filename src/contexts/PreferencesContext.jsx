import { createContext, useContext, useEffect, useState } from 'react';
import { SPORTS } from '../constants/sports.js';

const STORAGE_KEY = 'sportlyzer_prefs';

const DEFAULT_PREFS = {
  onboardingDone:    false,
  favoriteSports:    SPORTS.map(s => s.id),
  defaultMode:       'inplay',
  defaultTab:        'info',
  theme:             'auto',
  knowledgeLevel:    'intermediate',
  showAIButton:      true,
  showPossessionBar: true,
  showStatsPreview:  true,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function save(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    applyTheme(prefs.theme);
  }, [prefs.theme]);

  function updatePrefs(partial) {
    setPrefs(prev => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }

  function completeOnboarding(partial = {}) {
    updatePrefs({ ...partial, onboardingDone: true });
  }

  return (
    <PreferencesContext.Provider value={{ prefs, updatePrefs, completeOnboarding }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
