const OFFLINE_CACHE_PREFIX = 'santa-biblia-library';
const OFFLINE_LIBRARY_REVISION = 'v1';
const DOWNLOAD_CONCURRENCY = 3;
const BACKGROUND_DOWNLOAD_CONCURRENCY = 2;
const BACKGROUND_YIELD_INTERVAL = 4;

function canUseCacheStorage() {
  return typeof globalThis.caches !== 'undefined';
}

function cacheName(kind, id = '') {
  const suffix = id ? `-${id}` : '';
  return `${OFFLINE_CACHE_PREFIX}-${kind}${suffix}-${OFFLINE_LIBRARY_REVISION}`;
}

function absoluteUrl(url) {
  return new URL(url, globalThis.location?.origin ?? 'http://localhost').toString();
}

function requestPath(requestUrl) {
  const parsed = new URL(requestUrl, window.location.origin);
  return `${parsed.pathname}${parsed.search}`;
}

function bibleChapterUrl(version, book, chapter) {
  return `/data/${version}/${book.file}/${chapter}.json`;
}

function commentaryChapterUrl(bookId, chapter) {
  return `/data/cba/${bookId}/${chapter}.json`;
}

function completionMarkerUrl(kind, id = '') {
  const suffix = id ? `-${id}` : '';
  return `/offline-library/${kind}${suffix}-${OFFLINE_LIBRARY_REVISION}.json`;
}

async function getBooks() {
  const response = await fetch('/data/books.json');
  if (!response.ok) throw new Error('No fue posible preparar el índice bíblico.');
  return response.json();
}

async function getCache(kind, id) {
  if (!canUseCacheStorage()) return null;
  return globalThis.caches.open(cacheName(kind, id));
}

async function cachedResponse(kind, id, url) {
  const cache = await getCache(kind, id);
  if (!cache) return null;
  const response = await cache.match(absoluteUrl(url));
  return response ? response.clone() : null;
}

function emitProgress(onProgress, completed, total, phase) {
  onProgress?.({
    completed,
    total,
    progress: total > 0 ? Math.round((completed / total) * 100) : 100,
    phase,
  });
}

function waitForBackgroundYield() {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(resolve, { timeout: 300 });
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

async function readCompletionMarker(cache, kind, id, total) {
  const marker = await cache.match(absoluteUrl(completionMarkerUrl(kind, id)));
  if (!marker) return false;

  try {
    const payload = await marker.json();
    return payload?.revision === OFFLINE_LIBRARY_REVISION && payload?.total === total;
  } catch {
    return false;
  }
}

async function writeCompletionMarker(cache, kind, id, total) {
  await cache.put(
    absoluteUrl(completionMarkerUrl(kind, id)),
    new Response(JSON.stringify({ revision: OFFLINE_LIBRARY_REVISION, total }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

async function downloadCollection({ kind, id, urls, phase, onProgress, background = false }) {
  const cache = await getCache(kind, id);
  if (!cache) throw new Error('Este navegador no permite preparar la biblioteca sin conexión.');

  const total = urls.length;
  if (await readCompletionMarker(cache, kind, id, total)) {
    emitProgress(onProgress, total, total, phase);
    return { total, downloaded: 0 };
  }

  const existingEntries = await cache.keys();
  const existingPaths = new Set(existingEntries.map((entry) => requestPath(entry.url)));
  const pending = urls.filter((url) => !existingPaths.has(requestPath(absoluteUrl(url))));
  let completed = total - pending.length;
  let nextIndex = 0;

  emitProgress(onProgress, completed, total, phase);

  const downloadNext = async () => {
    let downloadedSinceYield = 0;

    while (nextIndex < pending.length) {
      const url = pending[nextIndex];
      nextIndex += 1;

      const response = await fetch(absoluteUrl(url), { cache: 'reload' });
      if (!response.ok) {
        throw new Error(`No fue posible preparar ${url}.`);
      }

      await cache.put(absoluteUrl(url), response.clone());
      completed += 1;
      emitProgress(onProgress, completed, total, phase);

      downloadedSinceYield += 1;
      if (background && downloadedSinceYield >= BACKGROUND_YIELD_INTERVAL) {
        downloadedSinceYield = 0;
        await waitForBackgroundYield();
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(background ? BACKGROUND_DOWNLOAD_CONCURRENCY : DOWNLOAD_CONCURRENCY, pending.length) },
      downloadNext
    )
  );

  await writeCompletionMarker(cache, kind, id, total);

  return { total, downloaded: pending.length };
}

export function supportsOfflineLibrary() {
  return canUseCacheStorage();
}

export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Prepares every chapter of a Bible version in a dedicated cache. It is kept
 * apart from the regular browsing cache so reading remains dependable even
 * after the user has explored many other chapters.
 */
export async function prepareBibleVersion(version, { onProgress, background = false } = {}) {
  const books = await getBooks();
  const urls = books.flatMap((book) => (
    Array.from({ length: Number(book.chapters) || 0 }, (_, index) => (
      bibleChapterUrl(version, book, index + 1)
    ))
  ));

  return downloadCollection({
    kind: 'bible',
    id: version,
    urls,
    phase: 'bible',
    onProgress,
    background,
  });
}

/**
 * Prepares the editorial CBA chapter files once for every Bible version.
 */
export async function prepareCommentary({ onProgress, background = false } = {}) {
  const books = await getBooks();
  const urls = books.flatMap((book) => (
    Array.from({ length: Number(book.chapters) || 0 }, (_, index) => (
      commentaryChapterUrl(book.id, index + 1)
    ))
  ));

  return downloadCollection({
    kind: 'commentary',
    urls,
    phase: 'commentary',
    onProgress,
    background,
  });
}

export async function getOfflineBibleChapter(version, book, chapter) {
  return cachedResponse('bible', version, bibleChapterUrl(version, book, chapter));
}

export async function getOfflineCommentaryChapter(bookId, chapter) {
  return cachedResponse('commentary', '', commentaryChapterUrl(bookId, chapter));
}

/**
 * The search experience still asks for a complete book. When the installed
 * library is ready, compose it from the durable chapter cache instead of
 * issuing a network request for the legacy full-book payload.
 */
export async function getOfflineBibleBook(version, book) {
  const cache = await getCache('bible', version);
  if (!cache) return null;

  const chapters = [];
  const chapterCount = Number(book.chapters) || 0;

  for (let chapter = 1; chapter <= chapterCount; chapter += 1) {
    const response = await cache.match(absoluteUrl(bibleChapterUrl(version, book, chapter)));
    if (!response) return null;

    const payload = await response.json();
    const verses = Array.isArray(payload) ? payload : payload?.verses;
    if (!Array.isArray(verses)) return null;
    chapters.push({ chapter, verses });
  }

  return {
    name: book.name,
    chapters,
  };
}
