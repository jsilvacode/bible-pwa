/**
 * LRU cache for inverted search indexes per Bible book.
 *
 * - Builds a Map<word, Set<verseId>> on first load of a book
 * - Keeps up to `maxSize` books in memory (LRU eviction)
 * - Makes whole-term search O(1) per word instead of O(n) per verse
 */

import { normalizeSearchText } from './searchText';

export class SearchIndex {
  #maxSize;
  #cache = new Map();  // key: "version_bookId" → { index: Map<word, Set<verseId>>, verses: array }

  constructor(maxSize = 5) {
    this.#maxSize = maxSize;
  }

  /** Build the inverted index from raw book chapters data */
  build(version, bookId, bookData) {
    const key = `${version}_${bookId}`;
    const index = new Map();
    const verses = [];

    for (const chapter of bookData.chapters) {
      for (const verse of chapter.verses) {
        const id = { chapter: chapter.chapter, verse: verse.verse };
        verses.push({ ...id, text: verse.text });
        const words = normalizeSearchText(verse.text).split(/\s+/);
        const seen = new Set();
        for (const word of words) {
          if (!word || seen.has(word)) continue;
          seen.add(word);
          if (!index.has(word)) index.set(word, new Set());
          index.get(word).add(verses.length - 1);
        }
      }
    }

    // Evict LRU if at capacity
    if (this.#cache.size >= this.#maxSize) {
      const first = this.#cache.keys().next().value;
      this.#cache.delete(first);
    }

    this.#cache.set(key, { index, verses });
    // Touch key (re-set to move to end)
    this.#cache.delete(key);
    this.#cache.set(key, { index, verses });
  }

  /** Search for all terms (AND), returns array of { chapter, verse, text } */
  search(version, bookId, rawQuery) {
    const key = `${version}_${bookId}`;
    const entry = this.#cache.get(key);
    if (!entry) return null; // not cached yet

    // Touch for LRU
    this.#cache.delete(key);
    this.#cache.set(key, entry);

    const { index, verses } = entry;
    const terms = normalizeSearchText(rawQuery).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    let results = null;
    for (const term of terms) {
      const matchIds = index.get(term);
      if (!matchIds) return []; // one term not found → no results
      if (results === null) {
        results = new Set(matchIds);
      } else {
        results = new Set([...results].filter(id => matchIds.has(id)));
      }
    }

    return results ? [...results].map(i => verses[i]) : [];
  }

  has(version, bookId) {
    return this.#cache.has(`${version}_${bookId}`);
  }

  clear() {
    this.#cache.clear();
  }
}

// Singleton
export const searchIndex = new SearchIndex(5);
