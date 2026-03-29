export function normalizeDisplayedText(text) {
  if (typeof text !== 'string') return '';

  return text
    .normalize('NFC')
    .replace(/á/g, 'a')
    .replace(/Á/g, 'A')
    .replace(/\bpf\b/gi, 'por')
    .replace(/([A-Za-zÁÉÍÓÚáéíóúÑñ]+)tek\b/g, '$1ch')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
