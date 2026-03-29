import { useRef, useState } from 'react';
import { fetchBooksManifest, loadBibleBook } from '../services/bibleLoader';

export function useSearch(version) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const search = async (query) => {
    const requestId = ++requestIdRef.current;

    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    setResults([]);
    
    try {
      const books = await fetchBooksManifest();
      const q = query.toLowerCase();
      let matches = [];

      // Búsqueda lineal en todos los libros
      for (const book of books) {
        if (requestId !== requestIdRef.current) break;

        try {
          const bookData = await loadBibleBook(version, book.id);
          bookData.chapters.forEach(c => {
            c.verses.forEach(v => {
              if (v.text.toLowerCase().includes(q)) {
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
