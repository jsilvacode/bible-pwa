import { useState, useEffect } from 'react';
import { set, del, values } from 'idb-keyval';
import { bookmarksStore } from '../services/db';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    values(bookmarksStore).then(list => {
      setBookmarks(list.sort((a,b) => b.createdAt - a.createdAt));
    }).catch(console.error);
  }, []);

  const isBookmarked = (id) => bookmarks.some(b => b.id === id);

  const normalizeBookmarkPayload = (payload = {}) => ({
    version: payload.version,
    book: payload.book,
    chapter: payload.chapter,
    verse: payload.verse,
    text: payload.text,
  });

  const toggleBookmark = async (id, payload) => {
    if (isBookmarked(id)) {
      await del(id, bookmarksStore);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } else {
      const data = {
        ...normalizeBookmarkPayload(payload),
        id,
        createdAt: Date.now()
      };
      await set(id, data, bookmarksStore);
      setBookmarks(prev => [data, ...prev]);
    }
  };

  const removeBookmark = async (id) => {
    await del(id, bookmarksStore);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark };
}
