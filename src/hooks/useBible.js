import { useState, useEffect } from 'react';
import { loadBibleBook } from '../services/bibleLoader';

export function useBible(version, bookId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!version || !bookId) {
      return;
    }
    
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const bookData = await loadBibleBook(version, bookId);
        if (mounted) {
          setData(bookData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    load();
      
    return () => { mounted = false; };
  }, [version, bookId]);

  return { data, loading, error };
}
