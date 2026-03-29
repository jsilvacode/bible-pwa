import React from 'react';
import classes from './VerseMenu.module.css';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotes } from '../../hooks/useNotes';

export default function VerseMenu({ verse, payload, onClose }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { note, saveNote, deleteNote } = useNotes(payload?.id);
  const bookmarked = isBookmarked(payload?.id);

  const handleBookmark = () => {
    if (payload) {
      toggleBookmark(payload.id, payload);
    }
    onClose();
  };

  const handleHighlight = (color) => {
    if (payload?.onHighlight) {
      payload.onHighlight(color);
    }
    onClose();
  };

  const handleShare = async () => {
    if (!payload) return;

    const reference = `${payload.bookName || `Libro ${payload.book}`} ${payload.chapter}:${payload.verse}`;
    const cleanVerseText = String(payload.text || '').replace(/\s+/g, ' ').trim();
    const shareUrlObj = new URL(`${window.location.origin}/share/${payload.book}/${payload.chapter}/${payload.verse}`);
    shareUrlObj.searchParams.set('bookName', payload.bookName || `Libro ${payload.book}`);
    shareUrlObj.searchParams.set('text', cleanVerseText.slice(0, 200));
    const shareUrl = shareUrlObj.toString();
    const text = `${reference}\n\n${cleanVerseText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: reference,
          text,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
        alert('Versículo copiado. Puedes pegarlo en WhatsApp, correo o donde quieras.');
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
          '_blank',
          'noopener,noreferrer'
        );
      }
    } catch (e) {
      console.error('Error al compartir', e);
      alert('No fue posible compartir este versículo.');
    }

    onClose();
  };

  const handleNote = async () => {
    if (!payload) return;

    const existing = note?.content || '';
    const message = existing
      ? 'Edita tu nota. Déjala vacía para eliminarla.'
      : 'Escribe tu nota para este versículo.';
    const input = window.prompt(message, existing);
    if (input === null) {
      return;
    }

    const content = input.trim();
    try {
      if (!content) {
        await deleteNote(payload.id);
      } else {
        await saveNote({
          id: payload.id,
          version: payload.version,
          book: payload.book,
          chapter: payload.chapter,
          verse: payload.verse,
          verseText: payload.text,
          content,
        });
      }
      onClose();
    } catch (e) {
      console.error('Error al guardar nota', e);
      alert('No se pudo guardar la nota.');
    }
  };

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.menu} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h3>Versículo {verse}</h3>
        </div>
        <div className={classes.actions}>
          <button onClick={handleBookmark}>
            🔖 {bookmarked ? 'Quitar Marcador' : 'Añadir Marcador'}
          </button>
          
          <div className={classes.colorActions}>
             <button aria-label="Limpiar Color" className={classes.colorBtn} style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => handleHighlight(null)}>✕</button>
             <button aria-label="Amarillo" className={classes.colorBtn} style={{ background: 'var(--highlight-yellow)' }} onClick={() => handleHighlight('yellow')}></button>
             <button aria-label="Verde" className={classes.colorBtn} style={{ background: 'var(--highlight-green)' }} onClick={() => handleHighlight('green')}></button>
             <button aria-label="Azul" className={classes.colorBtn} style={{ background: 'var(--highlight-blue)' }} onClick={() => handleHighlight('blue')}></button>
             <button aria-label="Rosa" className={classes.colorBtn} style={{ background: 'var(--highlight-pink)' }} onClick={() => handleHighlight('pink')}></button>
          </div>
          
          <button onClick={handleNote}>
            ✏️ {note?.content ? 'Editar Nota' : 'Escribir Nota'}
          </button>
          <button onClick={handleShare}>
            📤 Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
