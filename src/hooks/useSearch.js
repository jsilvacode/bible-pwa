import { useRef, useState, useCallback } from 'react';
import { fetchBooksManifest, loadBibleBook } from '../services/bibleLoader';
import { searchIndex } from '../utils/searchIndex';

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

  const search = useCallback(async (query) => {
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

      for (const book of books) {
        if (requestId !== requestIdRef.current) break;

        try {
          // Try index-based search first
          if (!searchIndex.has(version, book.id)) {
            const bookData = await loadBibleBook(version, book.id);
            searchIndex.build(version, book.id, bookData);
          }

          const indexResults = searchIndex.search(version, book.id, trimmed);
          if (indexResults) {
            for (const r of indexResults) {
              // Double-check with whole-term matching for accuracy
              if (matchesWholeTerms(r.text, trimmed)) {
                matches.push({
                  book: book.id,
                  bookName: book.name,
                  chapter: r.chapter,
                  verse: r.verse,
                  text: r.text,
                  id: `${version}-${book.id}-${r.chapter}-${r.verse}`
                });
              }
            }
          }
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
  }, [version]);

  return { search, results, loading };
}
