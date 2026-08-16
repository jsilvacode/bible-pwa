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
  let loadBibleChapterFn;
  let resolveVersionIdFn;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    const module = await import('./bibleLoader');
    fetchBooksManifestFn = module.fetchBooksManifest;
    loadBibleBookFn = module.loadBibleBook;
    loadBibleChapterFn = module.loadBibleChapter;
    resolveVersionIdFn = module.resolveVersionId;
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
      if (url === '/data/versions.json') {
        return makeJsonResponse([
          { id: 'rva2015', available: true },
          { id: 'nbla', available: true },
          { id: 'kjv', available: true },
        ]);
      }
      if (url === '/data/rva2015/01_genesis.json') {
        return makeJsonResponse({
          name: 'Génesis',
          chapters: [{ chapter: 1, verses: [{ verse: 1, text: 'En el principio' }] }],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadBibleBookFn('rva2015', 1);
    const second = await loadBibleBookFn('rva2015', 1);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith('/data/versions.json');
    expect(fetchMock).toHaveBeenCalledWith('/data/books.json');
    expect(fetchMock).toHaveBeenCalledWith(
      '/data/rva2015/01_genesis.json',
      expect.objectContaining({})
    );
  });

  it('deduplicates concurrent manifest and book requests', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === '/data/books.json') {
        return makeJsonResponse([{ id: 1, file: '01_genesis' }]);
      }
      if (url === '/data/versions.json') {
        return makeJsonResponse([{ id: 'nbla', available: true }]);
      }
      if (url === '/data/nbla/01_genesis.json') {
        return makeJsonResponse({ name: 'Génesis', chapters: [] });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      loadBibleBookFn('nbla', 1),
      loadBibleBookFn('nbla', 1),
    ]);

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('loads and caches only one chapter payload', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === '/data/books.json') {
        return makeJsonResponse([{ id: 1, file: '01_genesis', name: 'Génesis', chapters: 50 }]);
      }
      if (url === '/data/versions.json') {
        return makeJsonResponse([{ id: 'nbla', available: true }]);
      }
      if (url === '/data/nbla/01_genesis/3.json') {
        return makeJsonResponse([{ verse: 1, text: 'Y dijo Dios' }]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadBibleChapterFn('nbla', 1, 3);
    const second = await loadBibleChapterFn('nbla', 1, 3);

    expect(first).toEqual(second);
    expect(first.name).toBe('Génesis');
    expect(first.chapterCount).toBe(50);
    expect(first.chapters).toEqual([
      { chapter: 3, verses: [{ verse: 1, text: 'Y dijo Dios' }] },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith('/data/nbla/01_genesis/3.json', {});
  });

  it('migrates legacy rvr60 to rva2015 when loading', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === '/data/books.json') {
        return makeJsonResponse([{ id: 1, file: '01_genesis' }]);
      }
      if (url === '/data/versions.json') {
        return makeJsonResponse([{ id: 'rva2015', available: true }]);
      }
      if (url === '/data/rva2015/01_genesis.json') {
        return makeJsonResponse({ name: 'Génesis', chapters: [] });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await loadBibleBookFn('rvr60', 1);

    expect(fetchMock).toHaveBeenCalledWith(
      '/data/rva2015/01_genesis.json',
      expect.objectContaining({})
    );
  });

  it('resolveVersionId rejects invalid ids', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/data/versions.json') {
        return makeJsonResponse([{ id: 'nbla', available: true }]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    await expect(resolveVersionIdFn('../cba')).resolves.toBe('nbla');
  });
});
