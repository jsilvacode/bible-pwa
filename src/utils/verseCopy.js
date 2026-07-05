/**
 * Utilidades para enriquecer el texto copiado desde el lector con la cita de
 * origen (libro capítulo:versículo) y un enlace a la Biblia.
 */

/**
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {string} bookName
 * @param {number|string} chapter
 * @param {number} verseStart
 * @param {number} [verseEnd]
 * @returns {string}
 */
export function buildVerseReference(bookName, chapter, verseStart, verseEnd) {
  const book = bookName || 'La Biblia';
  if (!verseEnd || verseStart === verseEnd) {
    return `${book} ${chapter}:${verseStart}`;
  }
  return `${book} ${chapter}:${verseStart}-${verseEnd}`;
}

/**
 * @param {{ reference: string, text: string, url: string }} payload
 * @returns {string}
 */
export function buildCopyText({ reference, text, url }) {
  return `${reference}\n\n${text}\n\n${url}`;
}

/**
 * @param {{ reference: string, text: string, url: string }} payload
 * @returns {string}
 */
export function buildCopyHtml({ reference, text, url }) {
  return (
    `<p><strong>${escapeHtml(reference)}</strong></p>` +
    `<p>${escapeHtml(text)}</p>` +
    `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`
  );
}
