import { beforeEach, describe, expect, it, vi } from 'vitest';

function makeJsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe('cbaLoader', () => {
  let loadCbaVerse;
  let normalizeCbaEntry;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    ({ loadCbaVerse, normalizeCbaEntry } = await import('./cbaLoader'));
  });

  it('loads structured blocks from the per-chapter payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      expect(url).toBe('/data/cba/1/2.json');
      return makeJsonResponse({
        3: {
          b: [
            ['h', 'La luz.'],
            ['p', 'Dios vio que la luz era buena.'],
          ],
        },
      });
    }));

    await expect(loadCbaVerse(1, 2, 3)).resolves.toEqual({
      blocks: [
        { type: 'heading', text: 'La luz.' },
        { type: 'paragraph', text: 'Dios vio que la luz era buena.' },
      ],
    });
  });

  it('keeps compatibility with a valid legacy plain-text entry', () => {
    expect(normalizeCbaEntry('Primer párrafo.\n\nSegundo párrafo.')).toEqual({
      blocks: [
        { type: 'paragraph', text: 'Primer párrafo.' },
        { type: 'paragraph', text: 'Segundo párrafo.' },
      ],
    });
  });

  it('retains a deliberately unavailable source entry without rendering text', () => {
    expect(normalizeCbaEntry({ b: [], r: 'source-unavailable' })).toEqual({
      blocks: [],
      review: 'source-unavailable',
    });
  });
});
