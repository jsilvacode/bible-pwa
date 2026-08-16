import { useState, useEffect } from 'react';
import { loadBibleChapter } from '../services/bibleLoader';

export function useBible(version, bookId, chapter) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!version || !bookId || !chapter) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const bookData = await loadBibleChapter(version, bookId, chapter, { signal: controller.signal });
        if (mounted) {
          setData(bookData);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [version, bookId, chapter]);

  return { data, loading, error };
}
