import { useEffect, useState } from 'react';
import { usePreferences } from '../contexts/PreferencesContext.jsx';

export function useResolvedTheme() {
  const { prefs } = usePreferences();

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (prefs.theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [prefs.theme]);

  if (prefs.theme === 'dark')  return 'dark';
  if (prefs.theme === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}
