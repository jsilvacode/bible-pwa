import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOfflineBibleBook,
  getOfflineBibleChapter,
  getOfflineCommentaryChapter,
  prepareBibleVersion,
  prepareCommentary,
} from './offlineLibrary';

function makeResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeCacheStorage() {
  const stores = new Map();

  const getStore = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };

  return {
    open: vi.fn(async (name) => ({
      keys: async () => Array.from(getStore(name).keys()).map((url) => new Request(url)),
      match: async (request) => {
        const response = getStore(name).get(String(request));
        return response ? response.clone() : undefined;
      },
      put: async (request, response) => {
        getStore(name).set(String(request), response.clone());
      },
    })),
  };
}

const books = [{ id: 1, file: '01_genesis', name: 'Génesis', chapters: 2 }];

describe('offlineLibrary', () => {
  beforeEach(() => {
    window.caches = makeCacheStorage();
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const value = String(url);
      if (value.endsWith('/data/books.json')) return makeResponse(books);
      if (value.includes('/data/cba/')) return makeResponse({ 1: { b: [['p', 'Comentario sin conexión']] } });
      return makeResponse([{ verse: 1, text: 'Texto sin conexión' }]);
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a complete selected version in its dedicated cache', async () => {
    const progress = [];
    await prepareBibleVersion('nbla', { onProgress: (state) => progress.push(state.progress) });

    const chapter = await getOfflineBibleChapter('nbla', books[0], 1);
    const book = await getOfflineBibleBook('nbla', books[0]);

    expect(await chapter.json()).toEqual([{ verse: 1, text: 'Texto sin conexión' }]);
    expect(book?.chapters).toHaveLength(2);
    expect(progress.at(-1)).toBe(100);
  });

  it('stores the commentary separately from Bible editions', async () => {
    await prepareCommentary();
    const commentary = await getOfflineCommentaryChapter(1, 2);

    expect(await commentary.json()).toEqual({ 1: { b: [['p', 'Comentario sin conexión']] } });
  });
});
