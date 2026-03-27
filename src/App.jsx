import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext.jsx';
import { CurrentEventsProvider } from './contexts/CurrentEventsContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import LeaguePage from './pages/LeaguePage.jsx';
import SportPage from './pages/SportPage.jsx';
import Onboarding from './components/Onboarding.jsx';
import PreferencesModal from './components/PreferencesModal.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import './components/PreferencesModal.css';

function AppShell() {
  const { prefs } = usePreferences();
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <>
      {!prefs.onboardingDone && <Onboarding />}

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<Layout />}>
            <Route path="/sport/:slug" element={<LeaguePage />} />
            <Route path="/sport/:slug/events" element={<SportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <button className="pref-float-btn" onClick={() => setShowPrefs(true)} title="Preferências">
        ⚙️
      </button>

      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
    </>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);

  return (
    <PreferencesProvider>
      <CurrentEventsProvider>
        {splash && <SplashScreen onDone={() => setSplash(false)} />}
        {!splash && <AppShell />}
      </CurrentEventsProvider>
    </PreferencesProvider>
  );
}
