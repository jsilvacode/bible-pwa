import { beforeEach, describe, expect, it, vi } from 'vitest';

function makeJsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe('bibleLoader', () => {
  let fetchBooksManifestFn;
  let loadBibleBookFn;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    const module = await import('./bibleLoader');
    fetchBooksManifestFn = module.fetchBooksManifest;
    loadBibleBookFn = module.loadBibleBook;
  });

  it('loads books manifest from expected endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/data/books.json') {
        return makeJsonResponse([{ id: 1, file: '01_genesis' }]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const books = await fetchBooksManifestFn();

    expect(books).toHaveLength(1);
    expect(books[0].id).toBe(1);
    expect(fetch).toHaveBeenCalledWith('/data/books.json');
  });

  it('caches loaded book payload by version and book id', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === '/data/books.json') {
        return makeJsonResponse([{ id: 1, file: '01_genesis' }]);
      }
      if (url === '/data/rvr60/01_genesis.json') {
        return makeJsonResponse({
          name: 'Génesis',
          chapters: [{ chapter: 1, verses: [{ verse: 1, text: 'En el principio' }] }],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadBibleBookFn('rvr60', 1);
    const second = await loadBibleBookFn('rvr60', 1);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/data/books.json');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/data/rvr60/01_genesis.json');
  });
});
