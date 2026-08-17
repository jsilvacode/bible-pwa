import { normalizeSearchText } from '../utils/searchText';
import { getOfflineBibleBook } from '../services/offlineLibrary';

const MAX_RESULTS = 100;
const FETCH_CONCURRENCY = 6;
let latestRequestId = 0;
let corpusVersion = null;
let corpusPromise = null;

function normalizeWords(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildCorpus(version, books) {
  const orderedBooks = new Array(books.length);
  let cursor = 0;

  async function loadNextBook() {
    while (cursor < books.length) {
      const index = cursor++;
      const book = books[index];

      try {
        const offlineBook = await getOfflineBibleBook(version, book);
        const res = offlineBook ? null : await fetch(`/data/${version}/${book.file}.json`);
        if (!offlineBook && !res.ok) {
          orderedBooks[index] = [];
          continue;
        }

        const bookData = offlineBook ?? await res.json();
        const verses = [];
        for (const chapter of bookData.chapters) {
          for (const verse of chapter.verses) {
            verses.push({
              book: book.id,
              bookName: book.name,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text,
              normalized: normalizeWords(verse.text),
            });
          }
        }
        orderedBooks[index] = verses;
      } catch {
        orderedBooks[index] = [];
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(FETCH_CONCURRENCY, books.length) },
      () => loadNextBook()
    )
  );
  return orderedBooks.flat();
}

function getCorpus(version, books) {
  if (corpusVersion !== version || !corpusPromise) {
    corpusVersion = version;
    corpusPromise = buildCorpus(version, books);
  }
  return corpusPromise;
}

/**
 * Web Worker de búsqueda. Construye una vez un corpus compacto por versión y
 * realiza las consultas fuera del hilo principal para mantener fluida la UI.
 *
 * Mensajes de entrada: { requestId, version, query, books }
 * Mensajes de salida:
 *   { type: 'done', requestId, matches, truncated }
 *   { type: 'error', requestId, message }
 */
self.onmessage = async (event) => {
  if (event.data?.type === 'cancel') {
    latestRequestId = event.data.requestId;
    return;
  }

  const { requestId, version, query, books } = event.data || {};
  const trimmed = String(query || '').trim();
  latestRequestId = requestId;

  try {
    const corpus = await getCorpus(version, books);
    if (requestId !== latestRequestId) return;

    const terms = normalizeWords(trimmed).split(' ').filter(Boolean);
    const matches = [];
    let truncated = false;

    for (const item of corpus) {
      const padded = ` ${item.normalized} `;
      if (!terms.every((term) => padded.includes(` ${term} `))) continue;

      matches.push({
        book: item.book,
        bookName: item.bookName,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text,
        id: `${version}-${item.book}-${item.chapter}-${item.verse}`,
      });
      if (matches.length >= MAX_RESULTS) {
        truncated = true;
        break;
      }
    }

    if (requestId === latestRequestId) {
      self.postMessage({ type: 'done', requestId, matches, truncated });
    }
  } catch (err) {
    if (requestId === latestRequestId) {
      self.postMessage({ type: 'error', requestId, message: String(err) });
    }
  }
};
