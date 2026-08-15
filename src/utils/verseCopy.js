/**
 * Utilidades para enriquecer el texto copiado desde el lector con la cita de
 * origen (libro capítulo:versículo) y un enlace a la Biblia.
 */

// Los enlaces compartidos deben llevar siempre al dominio de producción. Así
// funcionan aunque alguien esté navegando desde el subdominio automático de
// Vercel y permiten a WhatsApp y redes leer los metadatos Open Graph.
export const PUBLIC_SITE_URL = 'https://www.santabiblia.cloud';

/**
 * @param {number|string} book
 * @param {number|string} chapter
 * @param {number|string} verse
 * @returns {string}
 */
export function buildVerseShareUrl(book, chapter, verse) {
  return `${PUBLIC_SITE_URL}/read/${book}/${chapter}/${verse}`;
}

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
  const book = bookName || 'Santa Biblia';
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
