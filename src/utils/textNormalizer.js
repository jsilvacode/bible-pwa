export function normalizeDisplayedText(text) {
  if (typeof text !== 'string') return '';

  return text
    .normalize('NFC')
    // Marcas heredadas de algunas fuentes USFM/HTML. Son estructurales, no
    // parte del versículo, y no deben llegar a la lectura, copia ni búsqueda.
    .replace(/(^|\s)¶\s*/gu, '$1')
    .replace(/^\s*[-–—]\s*»\s*/u, '«')
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}
