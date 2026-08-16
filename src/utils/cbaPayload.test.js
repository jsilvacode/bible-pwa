import { describe, expect, it } from 'vitest';
import { packCbaChapter } from '../../scripts/split-cba-by-chapter';

describe('packCbaChapter', () => {
  it('uses compact blocks without discarding the editorial review status', () => {
    expect(packCbaChapter({
      1: {
        blocks: [
          { type: 'heading', text: 'En el principio.' },
          { type: 'paragraph', text: 'Comentario.' },
        ],
        review: 'source-unavailable',
      },
    })).toEqual({
      1: {
        b: [
          ['h', 'En el principio.'],
          ['p', 'Comentario.'],
        ],
        r: 'source-unavailable',
      },
    });
  });
});
