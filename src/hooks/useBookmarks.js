import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { set, del, values } from 'idb-keyval';
import { bookmarksStore } from '../services/db';

const BookmarksContext = createContext(null);

function normalizeBookmarkPayload(payload = {}) {
  return {
    version: payload.version,
    book: payload.book,
    chapter: payload.chapter,
    verse: payload.verse,
    text: payload.text,
  };
}

export function BookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    values(bookmarksStore)
      .then((list) => {
        setBookmarks(list.sort((a, b) => b.createdAt - a.createdAt));
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const isBookmarked = useCallback(
    (id) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(async (id, payload) => {
    const exists = bookmarks.some((b) => b.id === id);
    if (exists) {
      await del(id, bookmarksStore);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } else {
      const data = {
        ...normalizeBookmarkPayload(payload),
        id,
        createdAt: Date.now(),
      };
      await set(id, data, bookmarksStore);
      setBookmarks((prev) => [data, ...prev]);
    }
  }, [bookmarks]);

  const removeBookmark = useCallback(async (id) => {
    await del(id, bookmarksStore);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const value = useMemo(
    () => ({ bookmarks, loaded, isBookmarked, toggleBookmark, removeBookmark }),
    [bookmarks, loaded, isBookmarked, toggleBookmark, removeBookmark]
  );

  return createElement(BookmarksContext.Provider, { value }, children);
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
