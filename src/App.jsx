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
import Chat from './components/Chat.jsx';
import './components/PreferencesModal.css';
import './components/Chat.css';

function AppShell() {
  const { prefs } = usePreferences();
  const [showPrefs, setShowPrefs] = useState(false);
  const [showChat,  setShowChat]  = useState(false);

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

      <button className="chat-float-btn" onClick={() => setShowChat(true)} title="Assistente IA">
        ✦
      </button>

      <button className="pref-float-btn" onClick={() => setShowPrefs(true)} title="Preferências">
        ⚙️
      </button>

      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
      {showChat  && <Chat onClose={() => setShowChat(false)} />}
    </>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <CurrentEventsProvider>
        <AppShell />
      </CurrentEventsProvider>
    </PreferencesProvider>
  );
}
