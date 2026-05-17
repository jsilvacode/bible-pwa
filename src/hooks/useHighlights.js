import { useState, useEffect } from 'react';
import { set, del, values } from 'idb-keyval';
import { highlightsStore } from '../services/db';

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

export function useHighlights(version, book, chapter) {
  const [highlights, setHighlights] = useState({});

  useEffect(() => {
    if (!version || !book || !chapter) return;

    const sessionKey = getSessionKey(book, chapter);
    const legacySessionKey = getLegacySessionKey(version, book, chapter);
    const fallbackMap = {};
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
    queueMicrotask(() => {
      setHighlights(fallbackMap);
    });

    values(highlightsStore).then(all => {
      const chapterHighlights = all.filter(h =>
        h.book === Number(book) &&
        h.chapter === Number(chapter)
      );

      const map = { ...fallbackMap };
      chapterHighlights
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .forEach((h) => {
          map[h.verse] = normalizeHighlightColor(h.color);
        });
      setHighlights(map);
      sessionStorage.setItem(sessionKey, JSON.stringify(map));
    }).catch((e) => {
      console.error('Error reading highlights from IndexedDB', e);
    });
  }, [version, book, chapter]);

  const setHighlight = async (payload, color) => {
    const sessionKey = getSessionKey(payload.book, payload.chapter);
    const newId = getHighlightId(payload.book, payload.chapter, payload.verse);
    const legacyId = payload.version
      ? `${payload.version}-${payload.book}-${payload.chapter}-${payload.verse}`
      : null;

    if (!color) {
      setHighlights(prev => {
        const next = { ...prev };
        delete next[payload.verse];
        sessionStorage.setItem(sessionKey, JSON.stringify(next));
        return next;
      });

      try {
        await del(newId, highlightsStore);
        if (legacyId) {
          await del(legacyId, highlightsStore);
        }
      } catch (e) {
        console.error('Error deleting highlight from IndexedDB', e);
      }
    } else {
      const normalizedColor = normalizeHighlightColor(color);
      const data = {
        ...payload,
        id: newId,
        color: normalizedColor,
        createdAt: Date.now(),
      };
      setHighlights(prev => {
        const next = { ...prev, [payload.verse]: normalizedColor };
        sessionStorage.setItem(sessionKey, JSON.stringify(next));
        return next;
      });

      try {
        await set(newId, data, highlightsStore);
        if (legacyId) {
          await del(legacyId, highlightsStore);
        }
      } catch (e) {
        console.error('Error saving highlight to IndexedDB', e);
      }
    }
  };

  return { highlights, setHighlight };
}
