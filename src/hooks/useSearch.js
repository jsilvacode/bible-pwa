import { useRef, useState } from 'react';
import { fetchBooksManifest, loadBibleBook } from '../services/bibleLoader';

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesWholeTerms(verseText, query) {
  const normalizedVerse = normalizeSearchText(verseText);
  const terms = normalizeSearchText(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return false;

  return terms.every((term) => {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, 'i');
    return pattern.test(normalizedVerse);
  });
}

export function useSearch(version) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const search = async (query) => {
    const requestId = ++requestIdRef.current;
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setResults([]);
    
    try {
      const books = await fetchBooksManifest();
      let matches = [];

      // Búsqueda lineal en todos los libros
      for (const book of books) {
        if (requestId !== requestIdRef.current) break;

        try {
          const bookData = await loadBibleBook(version, book.id);
          bookData.chapters.forEach(c => {
            c.verses.forEach(v => {
              if (matchesWholeTerms(v.text, trimmed)) {
                matches.push({
                  book: book.id,
                  bookName: bookData.name,
                  chapter: c.chapter,
                  verse: v.verse,
                  text: v.text,
                  id: `${version}-${book.id}-${c.chapter}-${v.verse}`
                });
              }
            });
          });
        } catch (e) {
          console.error(`Error searching in book ${book.id}`, e);
        }
      }
      if (requestId === requestIdRef.current) {
        setResults(matches);
      }
    } catch(e) {
      console.error(e);
    }
    if (requestId === requestIdRef.current) {
      setLoading(false);
    }
  };

  return { search, results, loading };
}
