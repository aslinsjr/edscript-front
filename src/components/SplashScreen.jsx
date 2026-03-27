import { useEffect, useState } from 'react';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import './SplashScreen.css';

function useIsDark() {
  const { prefs } = usePreferences();
  if (prefs.theme === 'dark')  return true;
  if (prefs.theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);
  const dark = useIsDark();

  const icon = dark ? '/icon-dark.png'  : '/icon-light.png';
  const logo = dark ? '/logo.png'       : '/logo-light.png';

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2400);
    const doneTimer = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`splash-root${fading ? ' splash-fade' : ''}`}>
      <div className="splash-content">
        <img src={icon} alt="Ícone" className="splash-icon" />
        <img src={logo} alt="Logo"  className="splash-logo" />
      </div>
    </div>
  );
}
