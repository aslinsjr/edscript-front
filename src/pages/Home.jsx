import { useState } from 'react';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import SearchBar     from '../components/SearchBar.jsx';
import RecentResults from '../components/RecentResults.jsx';
import EventModal    from '../components/EventModal.jsx';
import NewsSlider    from '../components/NewsSlider.jsx';
import './Home.css';

export default function Home() {
  const { prefs } = usePreferences();

  const isIntermediate = prefs.knowledgeLevel === 'intermediate' || prefs.knowledgeLevel === 'advanced';

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);

  function handleEventSelect(ev, sport) {
    if (!sport) return;
    setSelectedSport(sport);
    setSelectedEvent(ev);
  }

  return (
    <div className="home-page">
      <NewsSlider
        favoriteSportIds={prefs.favoriteSports}
        searchBar={isIntermediate && <SearchBar onEventSelect={handleEventSelect} />}
      />

      {isIntermediate && (
        <RecentResults
          favoriteSports={prefs.favoriteSports}
          onEventSelect={handleEventSelect}
        />
      )}

      {selectedEvent && selectedSport && (
        <EventModal
          ev={selectedEvent}
          sport={selectedSport}
          onClose={() => { setSelectedEvent(null); setSelectedSport(null); }}
        />
      )}
    </div>
  );
}
