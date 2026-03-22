import { createContext, useContext, useState } from 'react';

const CurrentEventsContext = createContext(null);

export function CurrentEventsProvider({ children }) {
  const [currentEvents, setCurrentEvents] = useState(null);
  const [currentMode,   setCurrentMode]   = useState(null);
  // null = home | 'inplay' | 'upcoming' | 'ended'

  return (
    <CurrentEventsContext.Provider value={{ currentEvents, setCurrentEvents, currentMode, setCurrentMode }}>
      {children}
    </CurrentEventsContext.Provider>
  );
}

export function useCurrentEvents() {
  return useContext(CurrentEventsContext);
}
