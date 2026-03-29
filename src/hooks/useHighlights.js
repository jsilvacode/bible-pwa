import { useState, useEffect } from 'react';
import { set, del, values } from 'idb-keyval';
import { highlightsStore } from '../services/db';

function getSessionKey(version, book, chapter) {
  return `session_highlights_${version}_${book}_${chapter}`;
}

export function useHighlights(version, book, chapter) {
  const [highlights, setHighlights] = useState({});

  useEffect(() => {
    if (!version || !book || !chapter) return;

    const sessionKey = getSessionKey(version, book, chapter);
    const fallbackMap = {};
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        Object.assign(fallbackMap, JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading highlights from sessionStorage', e);
    }
    queueMicrotask(() => {
      setHighlights(fallbackMap);
    });

    values(highlightsStore).then(all => {
      const chapterHighlights = all.filter(h =>
        h.version === version &&
        h.book === Number(book) &&
        h.chapter === Number(chapter)
      );

      const map = { ...fallbackMap };
      chapterHighlights.forEach(h => { map[h.verse] = h.color; });
      setHighlights(map);
      sessionStorage.setItem(sessionKey, JSON.stringify(map));
    }).catch((e) => {
      console.error('Error reading highlights from IndexedDB', e);
    });
  }, [version, book, chapter]);

  const setHighlight = async (payload, color) => {
    const sessionKey = getSessionKey(payload.version, payload.book, payload.chapter);

    if (!color) {
      setHighlights(prev => {
        const next = { ...prev };
        delete next[payload.verse];
        sessionStorage.setItem(sessionKey, JSON.stringify(next));
        return next;
      });

      try {
        await del(payload.id, highlightsStore);
      } catch (e) {
        console.error('Error deleting highlight from IndexedDB', e);
      }
    } else {
      const data = { ...payload, color, createdAt: Date.now() };
      setHighlights(prev => {
        const next = { ...prev, [payload.verse]: color };
        sessionStorage.setItem(sessionKey, JSON.stringify(next));
        return next;
      });

      try {
        await set(payload.id, data, highlightsStore);
      } catch (e) {
        console.error('Error saving highlight to IndexedDB', e);
      }
    }
  };

  return { highlights, setHighlight };
}
