import { getOfflineCommentaryChapter } from './offlineLibrary';

const chapterCache = new Map();
const MAX_CHAPTER_CACHE = 8;

function legacyTextToBlocks(text) {
  return text
    .replace(/\r/g, '')
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((paragraph) => ({ type: 'paragraph', text: paragraph }));
}

/**
 * Allows the application to read both the original plain-text files and the
 * structured CBA entries generated from the verified RTF source.
 *
 * @param {unknown} value
 * @returns {{ blocks: Array<{ type: 'heading' | 'paragraph', text: string }>, review?: string } | null}
 */
export function normalizeCbaEntry(value) {
  if (typeof value === 'string') {
    const blocks = legacyTextToBlocks(value);
    return blocks.length > 0 ? { blocks } : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const sourceBlocks = Array.isArray(value.blocks) ? value.blocks : value.b;
  if (!Array.isArray(sourceBlocks)) return null;

  const blocks = sourceBlocks.map((block) => {
    if (Array.isArray(block)) {
      const [type, text] = block;
      return {
        type: type === 'h' ? 'heading' : 'paragraph',
        text,
      };
    }
    return block;
  }).filter((block) => (
      block
      && (block.type === 'heading' || block.type === 'paragraph')
      && typeof block.text === 'string'
      && block.text.trim().length > 0
    ));

  return {
    blocks,
    ...(typeof value.review === 'string' ? { review: value.review } : {}),
    ...(typeof value.r === 'string' ? { review: value.r } : {}),
  };
}

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
 * @returns {Promise<Record<string, unknown>>}
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
    const cached = chapterCache.get(cacheKey);
    chapterCache.delete(cacheKey);
    chapterCache.set(cacheKey, cached);
    return cached;
  }

  const url = `/data/cba/${book}/${ch}.json`;
  const offlineResponse = await getOfflineCommentaryChapter(bookNum, chapterNum);
  const res = offlineResponse ?? await fetch(url, { signal: options.signal });

  if (!res.ok) {
    throw new Error(`Error cargando comentario CBA desde ${url}`);
  }

  const data = await res.json();
  chapterCache.set(cacheKey, data);
  while (chapterCache.size > MAX_CHAPTER_CACHE) {
    chapterCache.delete(chapterCache.keys().next().value);
  }
  return data;
}

/**
 * @param {number | string} bookId
 * @param {number | string} chapter
 * @param {number | string} verse
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ blocks: Array<{ type: 'heading' | 'paragraph', text: string }>, review?: string } | null>}
 */
export async function loadCbaVerse(bookId, chapter, verse, options = {}) {
  const chapterData = await loadCbaChapter(bookId, chapter, options);
  return normalizeCbaEntry(chapterData[String(verse)]);
}
