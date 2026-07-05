import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { set, del, values } from 'idb-keyval';
import { highlightsStore } from '../services/db';

const HighlightsContext = createContext(null);

function getSessionKey(book, chapter) {
  return `session_highlights_${book}_${chapter}`;
}

function getLegacySessionKey(version, book, chapter) {
  return `session_highlights_${version}_${book}_${chapter}`;
}

function getHighlightId(book, chapter, verse) {
  return `${book}-${chapter}-${verse}`;
}

function normalizeHighlightColor(color) {
  if (color === 'yellow') return 'gold';
  if (color === 'pink') return 'red';
  if (color === 'blue') return 'blue';
  if (color === 'green') return 'green';
  return color;
}

function buildChapterMap(allHighlights, book, chapter, fallbackMap = {}) {
  const map = { ...fallbackMap };
  allHighlights
    .filter((h) => h.book === Number(book) && h.chapter === Number(chapter))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .forEach((h) => {
      map[h.verse] = normalizeHighlightColor(h.color);
    });
  return map;
}

export function HighlightsProvider({ children }) {
  const [allHighlights, setAllHighlights] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    values(highlightsStore)
      .then((list) => setAllHighlights(list))
      .catch((e) => console.error('Error reading highlights from IndexedDB', e))
      .finally(() => setLoaded(true));
  }, []);

  const getChapterHighlights = useCallback(
    (version, book, chapter) => {
      const sessionKey = getSessionKey(book, chapter);
      const legacySessionKey = getLegacySessionKey(version, book, chapter);
      let fallbackMap = {};

      try {
        const raw = sessionStorage.getItem(sessionKey);
        const legacyRaw = sessionStorage.getItem(legacySessionKey);
        const source = raw || legacyRaw;
        if (source) {
          if (legacyRaw && !raw) {
            sessionStorage.setItem(sessionKey, legacyRaw);
          }
          const parsed = JSON.parse(source);
          Object.entries(parsed).forEach(([verse, color]) => {
            fallbackMap[verse] = normalizeHighlightColor(color);
          });
        }
      } catch (e) {
        console.error('Error reading highlights from sessionStorage', e);
      }

      return buildChapterMap(allHighlights, book, chapter, fallbackMap);
    },
    [allHighlights]
  );

  const setHighlight = useCallback(async (payload, color) => {
    const sessionKey = getSessionKey(payload.book, payload.chapter);
    const newId = getHighlightId(payload.book, payload.chapter, payload.verse);
    const legacyId = payload.version
      ? `${payload.version}-${payload.book}-${payload.chapter}-${payload.verse}`
      : null;

    let nextAll;

    if (!color) {
      try {
        await del(newId, highlightsStore);
        if (legacyId) await del(legacyId, highlightsStore);
      } catch (e) {
        console.error('Error deleting highlight from IndexedDB', e);
      }
      nextAll = allHighlights.filter((h) => h.id !== newId && h.id !== legacyId);
    } else {
      const normalizedColor = normalizeHighlightColor(color);
      const data = {
        ...payload,
        id: newId,
        color: normalizedColor,
        createdAt: Date.now(),
      };
      try {
        await set(newId, data, highlightsStore);
        if (legacyId) await del(legacyId, highlightsStore);
      } catch (e) {
        console.error('Error saving highlight to IndexedDB', e);
      }
      nextAll = [
        ...allHighlights.filter((h) => h.id !== newId && h.id !== legacyId),
        data,
      ];
    }

    setAllHighlights(nextAll);
    const map = buildChapterMap(nextAll, payload.book, payload.chapter);
    sessionStorage.setItem(sessionKey, JSON.stringify(map));
  }, [allHighlights]);

  const value = useMemo(
    () => ({ loaded, getChapterHighlights, setHighlight }),
    [loaded, getChapterHighlights, setHighlight]
  );

  return createElement(HighlightsContext.Provider, { value }, children);
}

export function useHighlights(version, book, chapter) {
  const context = useContext(HighlightsContext);
  if (!context) {
    throw new Error('useHighlights must be used within a HighlightsProvider');
  }

  const { getChapterHighlights, setHighlight } = context;
  const [highlights, setHighlights] = useState({});

  useEffect(() => {
    if (!version || !book || !chapter) return;
    setHighlights(getChapterHighlights(version, book, chapter));
  }, [version, book, chapter, getChapterHighlights]);

  const setHighlightForVerse = useCallback(
    (payload, color) => setHighlight(payload, color),
    [setHighlight]
  );

  return { highlights, setHighlight: setHighlightForVerse };
}
