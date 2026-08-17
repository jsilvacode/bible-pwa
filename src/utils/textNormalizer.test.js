import { describe, expect, it } from 'vitest';
import { normalizeDisplayedText } from './textNormalizer';

describe('normalizeDisplayedText', () => {
  it('preserves Spanish accents and editorial punctuation', () => {
    expect(normalizeDisplayedText('Él enseñó: «Ámense los unos a los otros».'))
      .toBe('Él enseñó: «Ámense los unos a los otros».');
  });

  it('removes source paragraph markers without altering the verse', () => {
    expect(normalizeDisplayedText('¶ -»El Señor está cerca.'))
      .toBe('«El Señor está cerca.');
  });

  it('cleans invisible source characters and excess spacing', () => {
    expect(normalizeDisplayedText('La\u00AD  gracia\u200B  de Dios , permanece.'))
      .toBe('La gracia de Dios, permanece.');
  });
});
