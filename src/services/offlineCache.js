const OFFLINE_CACHE_PREFIX = 'santa-biblia-library';
const OFFLINE_LIBRARY_REVISION = 'v1';

function cacheName(kind, id = '') {
  const suffix = id ? `-${id}` : '';
  return `${OFFLINE_CACHE_PREFIX}-${kind}${suffix}-${OFFLINE_LIBRARY_REVISION}`;
}

function absoluteUrl(url) {
  return new URL(url, globalThis.location?.origin ?? 'http://localhost').toString();
}

async function cachedResponse(kind, id, url) {
  if (typeof globalThis.caches === 'undefined') return null;

  const cache = await globalThis.caches.open(cacheName(kind, id));
  const response = await cache.match(absoluteUrl(url));
  return response ? response.clone() : null;
}

export function bibleChapterUrl(version, book, chapter) {
  return `/data/${version}/${book.file}/${chapter}.json`;
}

export function commentaryChapterUrl(bookId, chapter) {
  return `/data/cba/${bookId}/${chapter}.json`;
}

export async function getOfflineBibleChapter(version, book, chapter) {
  return cachedResponse('bible', version, bibleChapterUrl(version, book, chapter));
}

export async function getOfflineCommentaryChapter(bookId, chapter) {
  return cachedResponse('commentary', '', commentaryChapterUrl(bookId, chapter));
}

export async function getOfflineBibleBook(version, book) {
  if (typeof globalThis.caches === 'undefined') return null;

  const cache = await globalThis.caches.open(cacheName('bible', version));
  const chapters = [];
  const chapterCount = Number(book.chapters) || 0;

  for (let chapter = 1; chapter <= chapterCount; chapter += 1) {
    const response = await cache.match(
      absoluteUrl(bibleChapterUrl(version, book, chapter))
    );
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
