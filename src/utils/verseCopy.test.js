import { describe, it, expect } from 'vitest';
import {
  buildVerseReference,
  buildCopyText,
  buildCopyHtml,
  escapeHtml,
} from './verseCopy';

describe('verseCopy', () => {
  it('construye una referencia de un solo versículo', () => {
    expect(buildVerseReference('Génesis', 1, 1)).toBe('Génesis 1:1');
  });

  it('construye un rango cuando hay varios versículos', () => {
    expect(buildVerseReference('Juan', 3, 16, 18)).toBe('Juan 3:16-18');
  });

  it('colapsa el rango si inicio y fin coinciden', () => {
    expect(buildVerseReference('Salmos', 23, 1, 1)).toBe('Salmos 23:1');
  });

  it('usa un nombre por defecto si falta el libro', () => {
    expect(buildVerseReference('', 1, 1)).toBe('La Biblia 1:1');
  });

  it('arma el texto plano con cita, texto y url', () => {
    const out = buildCopyText({
      reference: 'Génesis 1:1',
      text: 'En el principio creó Dios los cielos y la tierra.',
      url: 'https://bible-pwa.vercel.app/read/1/1/1',
    });
    expect(out).toBe(
      'Génesis 1:1\n\nEn el principio creó Dios los cielos y la tierra.\n\nhttps://bible-pwa.vercel.app/read/1/1/1'
    );
  });

  it('escapa HTML para evitar inyección en el portapapeles', () => {
    expect(escapeHtml('a <b> & "c"')).toBe('a &lt;b&gt; &amp; "c"');
    const html = buildCopyHtml({
      reference: 'Génesis 1:1',
      text: 'texto <script>',
      url: 'https://x/read/1/1/1',
    });
    expect(html).toContain('<strong>Génesis 1:1</strong>');
    expect(html).toContain('texto &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
