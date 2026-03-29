import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SETTINGS_KEY = 'bible_settings';
const RECENT_KEY = 'bible_recent';

const defaultSettings = {
  version: 'rvr60',
  theme: 'light',
  fontSize: 'md',
  lastRead: { book: 1, chapter: 1 }
};

const SettingsContext = createContext(null);

function getInitialSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading settings', e);
  }
  return defaultSettings;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useRecentReads() {
  const [recent, setRecent] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading recent reads', e);
    }
    return [];
  });

  const addRecent = useCallback((book, chapter) => {
    setRecent(prev => {
      const newEntry = { book, chapter, ts: Date.now() };
      const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter));
      const updated = [newEntry, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recent, addRecent };
}
