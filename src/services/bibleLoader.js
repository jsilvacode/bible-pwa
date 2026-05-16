import { assertValidVersion } from '../constants/bibleVersions';

let booksCache = null;
/** @type {string[] | null} */
let validVersionIdsCache = null;
const booksByBookCache = {};

export async function fetchBooksManifest() {
  if (booksCache) return booksCache;
  try {
    const res = await fetch('/data/books.json');
    if (!res.ok) throw new Error('Manifest fetch failed');
    booksCache = await res.json();
    return booksCache;
  } catch (err) {
    console.error('Error fetching books manifest:', err);
    throw err;
  }
}

export async function fetchVersionsManifest() {
  try {
    const res = await fetch('/data/versions.json');
    if (!res.ok) throw new Error('Versions manifest fetch failed');
    const versions = await res.json();
    validVersionIdsCache = versions
      .filter((v) => v.available)
      .map((v) => v.id);
    return versions;
  } catch (err) {
    console.error('Error fetching versions manifest:', err);
    throw err;
  }
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
  const safeVersion = await resolveVersionId(version);
  const cacheKey = `${safeVersion}_${bookId}`;

  if (booksByBookCache[cacheKey]) {
    return booksByBookCache[cacheKey];
  }

  const books = await fetchBooksManifest();
  const bookMeta = books.find((b) => b.id === Number(bookId));
  if (!bookMeta) throw new Error('Libro no encontrado');

  const url = `/data/${safeVersion}/${bookMeta.file}.json`;
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) throw new Error(`Error cargando el libro desde ${url}`);

  const data = await res.json();
  booksByBookCache[cacheKey] = data;
  return data;
}

/**
 * Prefetch manifests and optionally warm the last-read book cache.
 * @param {{ version?: string, bookId?: number, chapter?: number }} [target]
 */
export async function warmupBibleData(target = {}) {
  const tasks = [fetchBooksManifest(), fetchVersionsManifest()];

  if (target.version && target.bookId) {
    const version = await resolveVersionId(target.version);
    tasks.push(
      loadBibleBook(version, target.bookId).catch(() => {
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
