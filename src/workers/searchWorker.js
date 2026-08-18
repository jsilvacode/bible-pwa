import { normalizeSearchText } from '../utils/searchText';
import { getOfflineBibleBook } from '../services/offlineLibrary';

const MAX_RESULTS = 100;
const corpusByVersion = new Map();
let latestRequestId = 0;
let activeController = null;

function normalizeWords(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMobileDevice() {
  if (typeof self.navigator?.userAgentData?.mobile === 'boolean') {
    return self.navigator.userAgentData.mobile;
  }
  return /Android|iPhone|iPad|iPod|Mobile/i.test(self.navigator?.userAgent || '');
}

function getFetchConcurrency() {
  const connection = self.navigator?.connection || self.navigator?.mozConnection || self.navigator?.webkitConnection;
  const effectiveType = connection?.effectiveType;
  const cores = Math.max(1, Number(self.navigator?.hardwareConcurrency) || 4);

  if (connection?.saveData || ['slow-2g', '2g'].includes(effectiveType)) return 1;
  if (!isMobileDevice()) return 6;
  if (effectiveType === '3g' || cores <= 4) return 2;
  return 3;
}

function yieldToMessages() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function getVersionCorpus(version) {
  if (!corpusByVersion.has(version)) {
    corpusByVersion.clear();
    corpusByVersion.set(version, new Map());
  }
  return corpusByVersion.get(version);
}

function indexBook(book, bookData) {
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
  return verses;
}

async function loadBook(version, book, signal) {
  const corpus = getVersionCorpus(version);
  if (corpus.has(book.id)) return corpus.get(book.id);

  const offlineBook = await getOfflineBibleBook(version, book);
  const response = offlineBook
    ? null
    : await fetch(`/data/${version}/${book.file}.json`, { signal });

  if (!offlineBook && !response.ok) throw new Error(`No fue posible cargar ${book.name}.`);

  const bookData = offlineBook ?? await response.json();
  const verses = indexBook(book, bookData);
  corpus.set(book.id, verses);
  return verses;
}

function findMatches(verses, terms, version) {
  const matches = [];
  for (const item of verses) {
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
  }
  return matches;
}

function getContiguousMatches(matchesByBook) {
  const matches = [];
  let completedBooks = 0;

  while (completedBooks < matchesByBook.length && matchesByBook[completedBooks] !== undefined) {
    matches.push(...matchesByBook[completedBooks]);
    if (matches.length >= MAX_RESULTS) break;
    completedBooks += 1;
  }

  return {
    matches: matches.slice(0, MAX_RESULTS),
    completedBooks,
  };
}

function postProgress(requestId, matches, completed, total) {
  self.postMessage({
    type: 'progress',
    requestId,
    matches,
    completed,
    total,
  });
}

async function searchProgressively({ requestId, version, query, books, controller }) {
  const terms = normalizeWords(query).split(' ').filter(Boolean);
  if (terms.length === 0) {
    self.postMessage({ type: 'done', requestId, matches: [], truncated: false });
    return;
  }

  const matchesByBook = new Array(books.length);
  const concurrency = Math.min(getFetchConcurrency(), books.length);
  let nextIndex = 0;
  let loadedBooks = 0;
  let finished = false;

  const finish = (truncated) => {
    if (finished || requestId !== latestRequestId) return;
    finished = true;
    const { matches } = getContiguousMatches(matchesByBook);
    self.postMessage({ type: 'done', requestId, matches, truncated });
    if (truncated) controller.abort();
  };

  const loadNextBook = async () => {
    while (!finished && requestId === latestRequestId && !controller.signal.aborted) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= books.length) return;

      try {
        const verses = await loadBook(version, books[index], controller.signal);
        if (requestId !== latestRequestId || controller.signal.aborted) return;
        matchesByBook[index] = findMatches(verses, terms, version);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        matchesByBook[index] = [];
      }

      loadedBooks += 1;
      const { matches, completedBooks } = getContiguousMatches(matchesByBook);
      if (matches.length >= MAX_RESULTS) {
        finish(true);
        return;
      }

      postProgress(requestId, matches, Math.max(loadedBooks, completedBooks), books.length);
      await yieldToMessages();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, loadNextBook));
  if (!finished && requestId === latestRequestId && !controller.signal.aborted) {
    finish(false);
  }
}

/**
 * Busca fuera del hilo principal y va entregando resultados por bloques.
 * En móviles reduce las descargas simultáneas para proteger la interacción.
 */
self.onmessage = async (event) => {
  if (event.data?.type === 'cancel') {
    latestRequestId = event.data.requestId;
    activeController?.abort();
    activeController = null;
    return;
  }

  const { requestId, version, query, books } = event.data || {};
  latestRequestId = requestId;
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  try {
    await searchProgressively({ requestId, version, query, books, controller });
  } catch (error) {
    if (requestId === latestRequestId && error?.name !== 'AbortError') {
      self.postMessage({ type: 'error', requestId, message: String(error) });
    }
  } finally {
    if (activeController === controller) activeController = null;
  }
};
