/**
 * @param {unknown} bookId
 * @param {unknown} chapter
 * @param {Array<{ id: number, chapters: number }>} books
 * @returns {{ valid: boolean, bookId?: number, chapter?: number, reason?: string }}
 */
export function validateReadRoute(bookId, chapter, books) {
  const bookNum = Number(bookId);
  const chapterNum = Number(chapter);

  if (!Number.isInteger(bookNum) || bookNum < 1 || bookNum > 66) {
    return { valid: false, reason: 'Libro no válido' };
  }

  const bookMeta = books.find((b) => b.id === bookNum);
  if (!bookMeta) {
    return { valid: false, reason: 'Libro no encontrado' };
  }

  if (!Number.isInteger(chapterNum) || chapterNum < 1 || chapterNum > bookMeta.chapters) {
    return { valid: false, reason: 'Capítulo no válido' };
  }

  return { valid: true, bookId: bookNum, chapter: chapterNum };
}

/**
 * @param {unknown} verse
 * @returns {number | null}
 */
export function validateVerseParam(verse) {
  if (verse === undefined || verse === null || verse === '') return null;
  const verseNum = Number(verse);
  if (!Number.isInteger(verseNum) || verseNum < 1) return null;
  return verseNum;
}

/**
 * @param {unknown} bookId
 * @param {unknown} chapter
 * @returns {boolean}
 */
export function isSafeNumericId(bookId, chapter) {
  const book = String(bookId ?? '');
  const ch = String(chapter ?? '');
  return /^\d+$/.test(book) && /^\d+$/.test(ch);
}
