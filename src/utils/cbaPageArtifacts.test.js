import { describe, expect, it } from 'vitest';
import { removeLikelyInlinePageArtifacts } from '../../scripts/lib/cbaPageArtifacts';

describe('removeLikelyInlinePageArtifacts', () => {
  it('removes only numbers that belong to an editorial page sequence', () => {
    const entries = [
      { blocks: [{ text: 'La frase continúa 222 aquí.' }] },
      { blocks: [{ text: 'Otra idea 223 continúa.' }] },
      { blocks: [{ text: 'El texto sigue 224 naturalmente.' }] },
    ];

    expect(removeLikelyInlinePageArtifacts(entries)).toBe(3);
    expect(entries.map((entry) => entry.blocks[0].text)).toEqual([
      'La frase continúa aquí.',
      'Otra idea continúa.',
      'El texto sigue naturalmente.',
    ]);
  });

  it('preserves actual quantities and publication citations', () => {
    const entries = [
      { blocks: [{ text: 'Vivió 600 años (PP 348).' }] },
      { blocks: [{ text: 'La frase continúa 601 aquí.' }] },
      { blocks: [{ text: 'El texto sigue 602 naturalmente.' }] },
      { blocks: [{ text: 'Otro apartado 603 cierra la idea.' }] },
    ];

    removeLikelyInlinePageArtifacts(entries);

    expect(entries[0].blocks[0].text).toBe('Vivió 600 años (PP 348).');
    expect(entries[1].blocks[0].text).toBe('La frase continúa aquí.');
  });

  it('removes a page number inserted before a real age', () => {
    const entries = [
      { blocks: [{ text: 'Primera frase 379 sigue.' }] },
      { blocks: [{ text: 'Habían pasado 35 380 años.' }] },
      { blocks: [{ text: 'Última frase 381 termina.' }] },
    ];

    removeLikelyInlinePageArtifacts(entries);

    expect(entries[1].blocks[0].text).toBe('Habían pasado 35 años.');
  });
});
