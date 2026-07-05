const chapterCache = new Map();

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function sanitizeNumericId(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

/**
 * @param {number | string} bookId
 * @param {number | string} chapter
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Record<string, string>>}
 */
export async function loadCbaChapter(bookId, chapter, options = {}) {
  const bookNum = sanitizeNumericId(bookId);
  const chapterNum = sanitizeNumericId(chapter);
  if (!bookNum || !chapterNum) {
    throw new Error('Identificador de libro o capítulo no válido');
  }

  const book = String(bookNum);
  const ch = String(chapterNum);
  const cacheKey = `${book}_${ch}`;

  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey);
  }

  const url = `/data/cba/${book}/${ch}.json`;
  const res = await fetch(url, { signal: options.signal });

  if (!res.ok) {
    throw new Error(`Error cargando comentario CBA desde ${url}`);
  }

  const data = await res.json();
  chapterCache.set(cacheKey, data);
  return data;
}

/**
 * @param {number | string} bookId
 * @param {number | string} chapter
 * @param {number | string} verse
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string | null>}
 */
export async function loadCbaVerse(bookId, chapter, verse, options = {}) {
  const chapterData = await loadCbaChapter(bookId, chapter, options);
  return chapterData[String(verse)] ?? null;
}
