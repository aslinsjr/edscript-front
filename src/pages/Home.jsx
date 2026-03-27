import { useState } from 'react';
import AssistantChat from '../components/AssistantChat.jsx';
import EventModal    from '../components/EventModal.jsx';
import './Home.css';

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);

  function handleEventSelect(ev, sport) {
    if (!sport) return;
    setSelectedSport(sport);
    setSelectedEvent(ev);
  }

  return (
    <div className="home-page">
      <AssistantChat onEventSelect={handleEventSelect} />

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
