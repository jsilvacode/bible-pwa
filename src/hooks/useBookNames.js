import { useEffect, useState } from 'react';
import { fetchBooksManifest } from '../services/bibleLoader';

/**
 * @returns {{ bookNames: Record<number, string>, loading: boolean }}
 */
export function useBookNames() {
  const [bookNames, setBookNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchBooksManifest()
      .then((books) => {
        if (!mounted) return;
        const map = {};
        books.forEach((b) => {
          map[b.id] = b.name;
        });
        setBookNames(map);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { bookNames, loading };
}
