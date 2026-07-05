import { useRef, useState, useCallback, useEffect } from 'react';
import { fetchBooksManifest, loadBibleBook, resolveVersionId } from '../services/bibleLoader';
import { searchIndex } from '../utils/searchIndex';
import { matchesWholeTerms } from '../utils/searchText';

function workerSupported() {
  return typeof Worker !== 'undefined' && import.meta.env.MODE !== 'test';
}

export function useSearch(version) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
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
  const searchInMainThread = useCallback(async (requestId, safeVersion, trimmed, books, onProgress) => {
    const matches = [];
    setProgress({ current: 0, total: books.length });
    onProgress?.(0, books.length);

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
            }
          }
        }
      } catch (e) {
        console.error(`Error searching in book ${book.id}`, e);
      }

      if (requestId === requestIdRef.current) {
        const current = i + 1;
        setProgress({ current, total: books.length });
        onProgress?.(current, books.length);
      }
    }

    if (requestId === requestIdRef.current) {
      setResults(matches);
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query, options = {}) => {
    const requestId = ++requestIdRef.current;
    const trimmed = query.trim();
    const onProgress = options.onProgress;

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setProgress({ current: 0, total: 0 });
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress({ current: 0, total: 0 });

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

          if (msg.type === 'progress') {
            setProgress({ current: msg.current, total: msg.total });
            onProgress?.(msg.current, msg.total);
          } else if (msg.type === 'done') {
            setResults(msg.matches);
            setLoading(false);
          } else if (msg.type === 'error') {
            console.error('Error en worker de búsqueda:', msg.message);
            setLoading(false);
          }
        };
        worker.postMessage({ requestId, version: safeVersion, query: trimmed, books });
        return;
      }

      await searchInMainThread(requestId, safeVersion, trimmed, books, onProgress);
    } catch (e) {
      console.error(e);
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [version, searchInMainThread]);

  const cancelSearch = useCallback(() => {
    requestIdRef.current += 1;
    setLoading(false);
    setResults([]);
    setProgress({ current: 0, total: 0 });
  }, []);

  return { search, results, loading, progress, cancelSearch };
}
