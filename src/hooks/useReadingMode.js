import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';

const ReadingModeContext = createContext(null);

export function ReadingModeProvider({ children }) {
  const [chromeHidden, setChromeHidden] = useState(false);
  const [isReaderActive, setIsReaderActive] = useState(false);

  const setReaderActive = useCallback((active) => {
    setIsReaderActive(active);
    if (!active) setChromeHidden(false);
  }, []);

  const value = useMemo(
    () => ({ chromeHidden, setChromeHidden, isReaderActive, setReaderActive }),
    [chromeHidden, isReaderActive, setReaderActive]
  );

  return createElement(ReadingModeContext.Provider, { value }, children);
}

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error('useReadingMode must be used within a ReadingModeProvider');
  }
  return context;
}
