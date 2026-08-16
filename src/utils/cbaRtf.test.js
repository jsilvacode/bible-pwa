import { describe, expect, it } from 'vitest';
import { formatBibleReferences, parseCbaRtf } from '../../scripts/lib/cbaRtf';

describe('parseCbaRtf', () => {
  it('preserva títulos, párrafos y caracteres Unicode del RTF', () => {
    const source = String.raw`\par{\pard\cf6 [Gen_1:2 \b Desordenada y vac\u237?a.\par} M\u225?s exactamente \"desolada\". 221\par`;

    expect(parseCbaRtf(source)).toEqual({
      blocks: [
        { type: 'heading', text: 'Desordenada y vacía.' },
        { type: 'paragraph', text: 'Más exactamente "desolada".' },
      ],
      warnings: ['removed-page-artifact'],
    });
  });

  it('no inventa versículos cuando la referencia de origen está truncada', () => {
    expect(formatBibleReferences('Ver Gen_2: y Psa_23:1-3.')).toBe(
      'Ver Génesis 2 y Salmos 23:1-3.',
    );
  });

  it('resuelve referencias contextuales sin exponer códigos del módulo', () => {
    expect(formatBibleReferences('Ver YYY_1:16 y Phi_5-11.', {
      bookName: 'Filipenses',
      chapter: 2,
      chapterCount: 4,
    })).toBe('Ver Filipenses 1:16 y Filipenses 2:5-11.');
  });

  it('conserva la puntuación tipográfica incluida en el RTF', () => {
    const source = String.raw`\par Una\emdash prueba con \ldblquote comillas\rdblquote.\par`;

    expect(parseCbaRtf(source).blocks).toEqual([
      { type: 'paragraph', text: 'Una—prueba con “comillas”.' },
    ]);
  });

  it('rechaza entradas que no son RTF legible', () => {
    expect(parseCbaRtf('rvsDyna\u0003')).toEqual({
      blocks: [],
      warnings: ['invalid-rtf'],
    });
  });
});
