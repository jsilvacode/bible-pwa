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

function getInitialRecent() {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) {
      return normalizeRecent(JSON.parse(saved));
    }
  } catch (e) {
    console.error('Error reading recent reads', e);
  }
  return [];
}

function normalizeRecent(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const sorted = [...list].sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
  const normalized = [];

  for (const item of sorted) {
    const book = Number(item?.book);
    const chapter = Number(item?.chapter);
    if (!book || !chapter) continue;

    const key = `${book}-${chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      book,
      chapter,
      ts: Number(item?.ts) || Date.now(),
    });

    if (normalized.length >= 5) break;
  }

  return normalized;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getInitialSettings);
  const [recent, setRecent] = useState(getInitialRecent);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(normalizeRecent(recent)));
  }, [recent]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const addRecent = useCallback((book, chapter) => {
    setRecent(prev => {
      const newEntry = { book, chapter, ts: Date.now() };
      const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter));
      return normalizeRecent([newEntry, ...filtered]);
    });
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, recent, addRecent }),
    [settings, updateSettings, recent, addRecent]
  );
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
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useRecentReads must be used within a SettingsProvider');
  }
  return { recent: context.recent, addRecent: context.addRecent };
}
