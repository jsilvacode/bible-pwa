import { startTransition, useRef, useState, useCallback, useEffect } from 'react';
import { fetchBooksManifest, loadBibleBook, resolveVersionId } from '../services/bibleLoader';
import { searchIndex } from '../utils/searchIndex';
import { matchesWholeTerms } from '../utils/searchText';

const MAX_SEARCH_RESULTS = 100;

function workerSupported() {
  return typeof Worker !== 'undefined' && import.meta.env.MODE !== 'test';
}

export function useSearch(version) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const requestIdRef = useRef(0);
  const workerRef = useRef(null);

  useEffect(() => {
    if (!workerSupported()) return undefined;
    try {
      workerRef.current = new Worker(
        new URL('../workers/searchWorker.js', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.error('No se pudo iniciar el worker de búsqueda', e);
      workerRef.current = null;
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Búsqueda en el hilo principal (fallback si el worker no está disponible).
  const searchInMainThread = useCallback(async (requestId, safeVersion, trimmed, books) => {
    const matches = [];
    let wasTruncated = false;

    for (let i = 0; i < books.length; i++) {
      if (requestId !== requestIdRef.current) break;
      const book = books[i];

      try {
        if (!searchIndex.has(safeVersion, book.id)) {
          const bookData = await loadBibleBook(safeVersion, book.id);
          searchIndex.build(safeVersion, book.id, bookData);
        }

        const indexResults = searchIndex.search(safeVersion, book.id, trimmed);
        if (indexResults) {
          for (const r of indexResults) {
            if (matchesWholeTerms(r.text, trimmed)) {
              matches.push({
                book: book.id,
                bookName: book.name,
                chapter: r.chapter,
                verse: r.verse,
                text: r.text,
                id: `${safeVersion}-${book.id}-${r.chapter}-${r.verse}`,
              });
              if (matches.length >= MAX_SEARCH_RESULTS) {
                wasTruncated = true;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error searching in book ${book.id}`, e);
      }

      if (wasTruncated) break;
    }

    if (requestId === requestIdRef.current) {
      startTransition(() => {
        setResults(matches);
        setTruncated(wasTruncated);
      });
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query) => {
    const requestId = ++requestIdRef.current;
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setTruncated(false);
      return;
    }

    setLoading(true);
    setResults([]);
    setTruncated(false);

    try {
      const [safeVersion, books] = await Promise.all([
        resolveVersionId(version),
        fetchBooksManifest(),
      ]);

      if (requestId !== requestIdRef.current) return;

      const worker = workerRef.current;
      if (worker) {
        worker.onmessage = (event) => {
          const msg = event.data;
          if (!msg || msg.requestId !== requestIdRef.current) return;

          if (msg.type === 'done') {
            startTransition(() => {
              setResults(msg.matches);
              setTruncated(Boolean(msg.truncated));
            });
            setLoading(false);
          } else if (msg.type === 'error') {
            console.error('Error en worker de búsqueda:', msg.message);
            setLoading(false);
          }
        };
        worker.postMessage({ requestId, version: safeVersion, query: trimmed, books });
        return;
      }

      await searchInMainThread(requestId, safeVersion, trimmed, books);
    } catch (e) {
      console.error(e);
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [version, searchInMainThread]);

  const cancelSearch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    workerRef.current?.postMessage({ type: 'cancel', requestId });
    setLoading(false);
    setResults([]);
    setTruncated(false);
  }, []);

  return { search, results, loading, truncated, cancelSearch };
}
