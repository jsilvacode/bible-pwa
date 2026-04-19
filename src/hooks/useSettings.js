import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SETTINGS_KEY = 'bible_settings';
const RECENT_KEY = 'bible_recent';
const LOG_KEY = 'bible_reading_log';

/** @typedef {"light" | "dark" | "graphite"} Theme */

const themeConfig = {
  light: {
    background: 'var(--dust)',
    text: 'var(--text-light)',
  },
  dark: {
    background: 'var(--noir)',
    text: 'var(--text-dark)',
  },
};

const defaultSettings = {
  version: 'rvr60',
  theme: 'light',
  tone: 'light',
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

function normalizeTheme(theme) {
  if (theme === 'sepia' || theme === 'grafito' || theme === 'graphite' || theme === 'noir') return 'dark';
  return themeConfig[theme] ? theme : 'light';
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

function getInitialLog() {
  try {
    const saved = localStorage.getItem(LOG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading log', e);
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
  const [settings, setSettings] = useState(() => {
    const initial = getInitialSettings();
    return { ...initial, theme: normalizeTheme(initial.theme) };
  });
  const [recent, setRecent] = useState(getInitialRecent);
  const [log, setLog] = useState(getInitialLog);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    const resolvedTheme = normalizeTheme(settings.theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(normalizeRecent(recent)));
  }, [recent]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-30)));
  }, [log]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (Object.prototype.hasOwnProperty.call(updates, 'theme')) {
        next.theme = normalizeTheme(updates.theme);
      }
      return next;
    });
  }, []);

  const addRecent = useCallback((book, chapter) => {
    const now = Date.now();
    const date = new Date(now).toISOString().split('T')[0];
    
    setRecent(prev => {
      const newEntry = { book, chapter, ts: now };
      const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter));
      return normalizeRecent([newEntry, ...filtered]);
    });

    setLog(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        return prev.map(l => l.date === date ? { ...l, count: l.count + 1 } : l);
      }
      return [...prev, { date, count: 1 }];
    });
  }, []);

  const weeklyStreak = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const entry = log.find(l => l.date === ds);
      days.push({
        date: ds,
        dayName: d.toLocaleDateString('es', { weekday: 'short' }).charAt(0).toUpperCase(),
        count: entry ? entry.count : 0
      });
    }
    return days;
  }, [log]);

  const value = useMemo(
    () => ({ settings, updateSettings, recent, addRecent, log, weeklyStreak }),
    [settings, updateSettings, recent, addRecent, log, weeklyStreak]
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
