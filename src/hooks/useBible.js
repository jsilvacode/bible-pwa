import { useState, useEffect } from 'react';
import { loadBibleBook } from '../services/bibleLoader';

export function useBible(version, bookId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!version || !bookId) {
      setLoading(false);
      return;
    }
    
    let mounted = true;
    setLoading(true);
    setError(null);
    
    loadBibleBook(version, bookId)
      .then(bookData => {
        if (mounted) {
          setData(bookData);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });
      
    return () => { mounted = false; };
  }, [version, bookId]);

  return { data, loading, error };
}
