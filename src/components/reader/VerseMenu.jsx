import React, { useState } from 'react';
import classes from './VerseMenu.module.css';
import { useBookmarks } from '../../hooks/useBookmarks';

export default function VerseMenu({ verse, payload, onClose, onShowCommentary }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
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

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.menu} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h3>Versículo {verse}</h3>
        </div>
        <div className={classes.actions}>
          <button onClick={() => { onShowCommentary(verse); onClose(); }}>
            📑 Comentario
          </button>
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
          
          <button onClick={() => { alert('Nota próximamente (v1.1)'); onClose(); }}>
            ✏️ Escribir Nota
          </button>
          <button onClick={() => { alert('¡Copiado al portapapeles! (Simulación)'); onClose(); }}>
            📤 Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
