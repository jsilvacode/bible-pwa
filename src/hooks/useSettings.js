import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'bible_settings';
const RECENT_KEY = 'bible_recent';

const defaultSettings = {
  version: 'rvr60',
  theme: 'light',
  fontSize: 'md',
  lastRead: { book: 1, chapter: 1 }
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading settings', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
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

  const addRecent = (book, chapter) => {
    setRecent(prev => {
      const newEntry = { book, chapter, ts: Date.now() };
      const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter));
      const updated = [newEntry, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recent, addRecent };
}
