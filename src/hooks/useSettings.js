import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_VERSION, normalizeVersionId } from '../constants/bibleVersions';

const SETTINGS_KEY = 'bible_settings';
const RECENT_KEY = 'bible_recent';
const LOG_KEY = 'bible_reading_log';
const VERSION_DEFAULT_REVISION = 2;
const READING_LOG_RETENTION_DAYS = 365;
const MAX_RECENT_READS = 1;

/** @typedef {"light" | "dark"} Theme */

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
  version: DEFAULT_VERSION,
  theme: 'light',
  fontSize: 'md',
  lastRead: { book: 1, chapter: 1 },
  versionDefaultRevision: VERSION_DEFAULT_REVISION,
};

const SettingsContext = createContext(null);

function getInitialSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const savedSettings = JSON.parse(saved);
      const parsed = { ...defaultSettings, ...savedSettings };
      const usesPreviousDefault = (
        Number(savedSettings.versionDefaultRevision || 0) < VERSION_DEFAULT_REVISION
        && ['rva2015', 'rvr60'].includes(savedSettings.version)
      );
      parsed.version = usesPreviousDefault
        ? DEFAULT_VERSION
        : normalizeVersionId(parsed.version);
      parsed.versionDefaultRevision = VERSION_DEFAULT_REVISION;
      return parsed;
    }
  } catch (e) {
    console.error('Error reading settings', e);
  }
  return defaultSettings;
}

function normalizeTheme(theme) {
  if (theme === 'sepia' || theme === 'graphite') return 'light';
  if (theme === 'grafito') return 'dark';
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
    if (saved) return normalizeLog(JSON.parse(saved));
  } catch (e) {
    console.error('Error reading log', e);
  }
  return [];
}

function getLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function shiftDate(date, amount) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
}

function normalizeLog(list) {
  if (!Array.isArray(list)) return [];

  const byDate = new Map();
  list.forEach((entry) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry?.date)) return;

    const chapters = Array.isArray(entry.chapters)
      ? [...new Set(entry.chapters.map(String))]
      : [];
    const count = Math.max(Number(entry.count) || 0, chapters.length);
    if (count < 1) return;

    byDate.set(entry.date, {
      date: entry.date,
      count,
      ...(chapters.length > 0 ? { chapters } : {}),
    });
  });

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-READING_LOG_RETENTION_DAYS);
}

function getStreakFromDates(dates, referenceDate = new Date()) {
  const referenceKey = getLocalDateKey(referenceDate);
  const yesterdayKey = getLocalDateKey(shiftDate(referenceDate, -1));
  let cursor = dates.has(referenceKey)
    ? referenceDate
    : dates.has(yesterdayKey)
      ? shiftDate(referenceDate, -1)
      : null;
  let current = 0;

  while (cursor && dates.has(getLocalDateKey(cursor))) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }

  return current;
}

function getBestStreak(log) {
  const dates = new Set(log.map((entry) => entry.date));
  let best = 0;

  for (const dateKey of dates) {
    const date = new Date(`${dateKey}T12:00:00`);
    const previousKey = getLocalDateKey(shiftDate(date, -1));
    if (dates.has(previousKey)) continue;

    let length = 0;
    let cursor = date;
    while (dates.has(getLocalDateKey(cursor))) {
      length += 1;
      cursor = shiftDate(cursor, 1);
    }
    best = Math.max(best, length);
  }

  return best;
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

    if (normalized.length >= MAX_RECENT_READS) break;
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
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-READING_LOG_RETENTION_DAYS)));
  }, [log]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (Object.prototype.hasOwnProperty.call(updates, 'theme')) {
        next.theme = normalizeTheme(updates.theme);
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'version')) {
        next.version = normalizeVersionId(updates.version);
      }
      return next;
    });
  }, []);

  const addRecent = useCallback((book, chapter) => {
    const now = Date.now();
    const date = getLocalDateKey(new Date(now));
    const chapterKey = `${book}-${chapter}`;
    
    setRecent(prev => {
      const newEntry = { book, chapter, ts: now };
      const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter));
      return normalizeRecent([newEntry, ...filtered]);
    });

    setLog(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        const chapters = Array.isArray(existing.chapters) ? existing.chapters : [];
        if (chapters.includes(chapterKey)) return prev;

        return normalizeLog(prev.map(l => l.date === date
          ? { ...l, count: (Number(l.count) || 0) + 1, chapters: [...chapters, chapterKey] }
          : l));
      }
      return normalizeLog([...prev, { date, count: 1, chapters: [chapterKey] }]);
    });
  }, []);

  const weeklyStreak = useMemo(() => {
    const days = [];
    const logByDate = new Map(log.map((entry) => [entry.date, entry]));
    for (let i = 6; i >= 0; i--) {
      const d = shiftDate(new Date(), -i);
      const ds = getLocalDateKey(d);
      const entry = logByDate.get(ds);
      days.push({
        date: ds,
        dayName: d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
        dayNumber: d.getDate(),
        isToday: i === 0,
        isRead: Boolean(entry),
        count: entry?.count || 0,
      });
    }
    return days;
  }, [log]);

  const readingSummary = useMemo(() => {
    const dates = new Set(log.map((entry) => entry.date));
    const todayKey = getLocalDateKey(new Date());

    return {
      currentStreak: getStreakFromDates(dates),
      bestStreak: getBestStreak(log),
      daysReadThisWeek: weeklyStreak.filter((day) => day.isRead).length,
      hasReadToday: dates.has(todayKey),
    };
  }, [log, weeklyStreak]);

  const value = useMemo(
    () => ({ settings, updateSettings, recent, addRecent, log, weeklyStreak, ...readingSummary }),
    [settings, updateSettings, recent, addRecent, log, weeklyStreak, readingSummary]
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
