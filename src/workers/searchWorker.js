import { searchIndex } from '../utils/searchIndex';
import { matchesWholeTerms } from '../utils/searchText';

/**
 * Web Worker de búsqueda. Descarga los libros, construye el índice invertido
 * y busca fuera del hilo principal para no bloquear la UI.
 *
 * Mensajes de entrada: { requestId, version, query, books }
 * Mensajes de salida:
 *   { type: 'progress', requestId, current, total }
 *   { type: 'done', requestId, matches }
 *   { type: 'error', requestId, message }
 */
self.onmessage = async (event) => {
  const { requestId, version, query, books } = event.data || {};
  const trimmed = String(query || '').trim();
  const matches = [];

  try {
    const total = books.length;
    self.postMessage({ type: 'progress', requestId, current: 0, total });

    for (let i = 0; i < books.length; i++) {
      const book = books[i];

      try {
        if (!searchIndex.has(version, book.id)) {
          const res = await fetch(`/data/${version}/${book.file}.json`);
          if (res.ok) {
            const bookData = await res.json();
            searchIndex.build(version, book.id, bookData);
          }
        }

        const indexResults = searchIndex.search(version, book.id, trimmed);
        if (indexResults) {
          for (const r of indexResults) {
            if (matchesWholeTerms(r.text, trimmed)) {
              matches.push({
                book: book.id,
                bookName: book.name,
                chapter: r.chapter,
                verse: r.verse,
                text: r.text,
                id: `${version}-${book.id}-${r.chapter}-${r.verse}`,
              });
            }
          }
        }
      } catch (err) {
        // Error por libro: continuar con el resto.
        console.error(`Worker: error searching in book ${book?.id}`, err);
      }

      self.postMessage({ type: 'progress', requestId, current: i + 1, total });
    }

    self.postMessage({ type: 'done', requestId, matches });
  } catch (err) {
    self.postMessage({ type: 'error', requestId, message: String(err) });
  }
};
