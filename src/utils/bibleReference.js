function normalizeBookKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Array<{ id: number, name: string, slug?: string, abbrev?: string }>} books
 */
export function createBookAliases(books) {
  const aliasMap = new Map();
  const romanMap = { 1: 'i', 2: 'ii', 3: 'iii' };

  books.forEach((book) => {
    const aliases = new Set([
      normalizeBookKey(book.name),
      normalizeBookKey(book.slug),
      normalizeBookKey(book.abbrev),
    ]);

    const numbered = normalizeBookKey(book.name).match(/^([1-3])\s+(.+)$/);
    if (numbered) {
      const [, n, rest] = numbered;
      aliases.add(`${n} ${rest}`);
      aliases.add(`${n}${rest}`);
      aliases.add(`${romanMap[n]} ${rest}`);
      aliases.add(`${romanMap[n]}${rest}`);
    }

    aliases.forEach((alias) => {
      if (!alias) return;
      aliasMap.set(alias, book.id);
      aliasMap.set(alias.replace(/\s+/g, ''), book.id);
    });
  });

  return aliasMap;
}

/**
 * @param {string} query
 * @param {Map<string, number>} aliasMap
 * @param {Record<number, { chapters: number }>} booksById
 */
export function parseBibleReference(query, aliasMap, booksById) {
  const cleaned = String(query)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/\s*:\s*/g, ':')
    .replace(/[^a-z0-9:\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const match = cleaned.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+))?$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse] = match;
  const bookKey = rawBook.trim();
  const bookId = aliasMap.get(bookKey) || aliasMap.get(bookKey.replace(/\s+/g, ''));
  if (!bookId) return null;

  const chapter = Number(rawChapter);
  const verse = rawVerse ? Number(rawVerse) : null;
  if (!chapter || chapter < 1) return null;
  if (verse !== null && (!verse || verse < 1)) return null;

  const bookMeta = booksById[bookId];
  if (!bookMeta || chapter > bookMeta.chapters) return null;

  return { bookId, chapter, verse };
}
