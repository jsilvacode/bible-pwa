import { assertValidVersion } from '../constants/bibleVersions';
import { getOfflineBibleBook, getOfflineBibleChapter } from './offlineLibrary';

let booksCache = null;
let booksPromise = null;
/** @type {string[] | null} */
let validVersionIdsCache = null;
/** @type {Array<Record<string, unknown>> | null} */
let versionsCache = null;
let versionsPromise = null;
const booksByBookCache = new Map();
const bookLoadPromises = new Map();
const MAX_BOOK_CACHE = 12;
const chaptersByChapterCache = new Map();
const chapterLoadPromises = new Map();
const MAX_CHAPTER_CACHE = 24;

function abortError() {
  const error = new Error('Operación cancelada');
  error.name = 'AbortError';
  return error;
}

function waitWithAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise((resolve, reject) => {
    const handleAbort = () => reject(abortError());
    signal.addEventListener('abort', handleAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      }
    );
  });
}

function cacheBook(key, data) {
  booksByBookCache.delete(key);
  booksByBookCache.set(key, data);
  while (booksByBookCache.size > MAX_BOOK_CACHE) {
    booksByBookCache.delete(booksByBookCache.keys().next().value);
  }
}

function cacheChapter(key, data) {
  chaptersByChapterCache.delete(key);
  chaptersByChapterCache.set(key, data);
  while (chaptersByChapterCache.size > MAX_CHAPTER_CACHE) {
    chaptersByChapterCache.delete(chaptersByChapterCache.keys().next().value);
  }
}

export async function fetchBooksManifest() {
  if (booksCache) return booksCache;
  if (!booksPromise) {
    booksPromise = fetch('/data/books.json')
      .then((res) => {
        if (!res.ok) throw new Error('Manifest fetch failed');
        return res.json();
      })
      .then((books) => {
        booksCache = books;
        return books;
      })
      .catch((err) => {
        console.error('Error fetching books manifest:', err);
        throw err;
      });
    booksPromise.then(
      () => { booksPromise = null; },
      () => { booksPromise = null; }
    );
  }
  return booksPromise;
}

export async function fetchVersionsManifest() {
  if (versionsCache) return versionsCache;
  if (!versionsPromise) {
    versionsPromise = fetch('/data/versions.json')
      .then((res) => {
        if (!res.ok) throw new Error('Versions manifest fetch failed');
        return res.json();
      })
      .then((versions) => {
        validVersionIdsCache = versions
          .filter((v) => v.available)
          .map((v) => v.id);
        versionsCache = versions;
        return versions;
      })
      .catch((err) => {
        console.error('Error fetching versions manifest:', err);
        throw err;
      });
    versionsPromise.then(
      () => { versionsPromise = null; },
      () => { versionsPromise = null; }
    );
  }
  return versionsPromise;
}

async function getValidVersionIds() {
  if (validVersionIdsCache) return validVersionIdsCache;
  await fetchVersionsManifest();
  return validVersionIdsCache ?? [];
}

/**
 * @param {unknown} version
 * @returns {Promise<string>}
 */
export async function resolveVersionId(version) {
  const normalized = assertValidVersion(version);
  const validIds = await getValidVersionIds();
  if (validIds.length > 0 && !validIds.includes(normalized)) {
    return assertValidVersion(null);
  }
  return normalized;
}

/**
 * @param {string} version
 * @param {string | number} bookId
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function loadBibleBook(version, bookId, options = {}) {
  const safeVersion = await waitWithAbort(resolveVersionId(version), options.signal);
  const normalizedBookId = Number(bookId);
  const cacheKey = `${safeVersion}_${normalizedBookId}`;

  if (booksByBookCache.has(cacheKey)) {
    const cached = booksByBookCache.get(cacheKey);
    cacheBook(cacheKey, cached);
    return cached;
  }

  let loadPromise = bookLoadPromises.get(cacheKey);
  if (!loadPromise) {
    loadPromise = (async () => {
      const books = await fetchBooksManifest();
      const bookMeta = books.find((b) => b.id === normalizedBookId);
      if (!bookMeta) throw new Error('Libro no encontrado');

      const offlineBook = await getOfflineBibleBook(safeVersion, bookMeta);
      if (offlineBook) {
        cacheBook(cacheKey, offlineBook);
        return offlineBook;
      }

      const url = `/data/${safeVersion}/${bookMeta.file}.json`;
      const res = await fetch(url, options.signal ? { signal: options.signal } : {});
      if (!res.ok) throw new Error(`Error cargando el libro desde ${url}`);

      const data = await res.json();
      cacheBook(cacheKey, data);
      return data;
    })();
    bookLoadPromises.set(cacheKey, loadPromise);
    loadPromise.then(
      () => bookLoadPromises.delete(cacheKey),
      () => bookLoadPromises.delete(cacheKey)
    );
  }

  return waitWithAbort(loadPromise, options.signal);
}

/**
 * Loads only one chapter instead of the complete book payload.
 * @param {string} version
 * @param {string | number} bookId
 * @param {string | number} chapter
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function loadBibleChapter(version, bookId, chapter, options = {}) {
  const safeVersion = await waitWithAbort(resolveVersionId(version), options.signal);
  const normalizedBookId = Number(bookId);
  const normalizedChapter = Number(chapter);

  if (!Number.isInteger(normalizedBookId) || normalizedBookId < 1) {
    throw new Error('Libro no válido');
  }
  if (!Number.isInteger(normalizedChapter) || normalizedChapter < 1) {
    throw new Error('Capítulo no válido');
  }

  const cacheKey = `${safeVersion}_${normalizedBookId}_${normalizedChapter}`;
  if (chaptersByChapterCache.has(cacheKey)) {
    const cached = chaptersByChapterCache.get(cacheKey);
    cacheChapter(cacheKey, cached);
    return cached;
  }

  let loadPromise = chapterLoadPromises.get(cacheKey);
  if (!loadPromise) {
    loadPromise = (async () => {
      const books = await fetchBooksManifest();
      const bookMeta = books.find((book) => book.id === normalizedBookId);
      if (!bookMeta) throw new Error('Libro no encontrado');

      const url = `/data/${safeVersion}/${bookMeta.file}/${normalizedChapter}.json`;
      const offlineResponse = await getOfflineBibleChapter(safeVersion, bookMeta, normalizedChapter);
      const res = offlineResponse ?? await fetch(url, options.signal ? { signal: options.signal } : {});
      if (!res.ok) throw new Error(`Error cargando el capítulo desde ${url}`);

      const payload = await res.json();
      const verses = Array.isArray(payload) ? payload : payload?.verses;
      if (!Array.isArray(verses)) throw new Error(`Formato inválido para ${url}`);

      const data = {
        version: safeVersion,
        book: normalizedBookId,
        name: bookMeta.name,
        chapterCount: Number(bookMeta.chapters) || 0,
        chapters: [{ chapter: normalizedChapter, verses }],
      };
      cacheChapter(cacheKey, data);
      return data;
    })();
    chapterLoadPromises.set(cacheKey, loadPromise);
    loadPromise.then(
      () => chapterLoadPromises.delete(cacheKey),
      () => chapterLoadPromises.delete(cacheKey)
    );
  }

  return waitWithAbort(loadPromise, options.signal);
}

/**
 * Prefetch manifests and optionally warm the last-read book cache.
 * @param {{ version?: string, bookId?: number, chapter?: number }} [target]
 */
export async function warmupBibleData(target = {}) {
  const tasks = [fetchBooksManifest(), fetchVersionsManifest()];

  if (target.version && target.bookId && target.chapter) {
    const version = await resolveVersionId(target.version);
    tasks.push(
      loadBibleChapter(version, target.bookId, target.chapter).catch(() => {
        /* prefetch is best-effort */
      })
    );
  }

  await Promise.all(tasks);
}

export function getBookName(bookId) {
  const book = booksCache?.find((b) => b.id === Number(bookId));
  return book?.name ?? `Libro ${bookId}`;
}

export function getTotalBooks() {
  return booksCache?.length ?? 66;
}

export function getBookChapterCount(bookId) {
  const book = booksCache?.find((item) => item.id === Number(bookId));
  return Number(book?.chapters) || 0;
}
