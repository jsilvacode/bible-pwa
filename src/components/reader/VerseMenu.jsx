import React, { useRef } from 'react';
import classes from './VerseMenu.module.css';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useToast } from '../../hooks/useToast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { shareVerse } from '../../utils/shareVerse';
import { IconCommentary, IconBookmark, IconShare } from '../ui/Icons';

export default function VerseMenu({ verse, payload, onClose }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { showToast } = useToast();
  const sheetRef = useRef(null);
  const bookmarked = isBookmarked(payload?.id);

  useFocusTrap(sheetRef, true);
  useModalDismiss(true, onClose);

  const handleBookmark = () => {
    if (payload) {
      toggleBookmark(payload.id, payload);
      showToast(bookmarked ? 'Marcador eliminado' : 'Marcador añadido');
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
    const shareUrl = `${window.location.origin}/read/${payload.book}/${payload.chapter}/${payload.verse}`;
    const text = `${reference}\n\n${cleanVerseText}`;

    try {
      const result = await shareVerse({ title: reference, text, url: shareUrl });
      if (result === 'copied') {
        showToast('Versículo copiado al portapapeles.');
      }
    } catch (e) {
      console.error('Error al compartir', e);
      showToast('No fue posible compartir este versículo.');
    }
  };

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div
        className={classes.sheet}
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Acciones para el versículo ${verse}`}
      >
        <div className={classes.handle} />

        <header className={classes.header}>
          <h3>Versículo {verse}</h3>
          <button type="button" className={classes.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className={classes.actions}>
          <button className={classes.mainAction} onClick={() => { payload?.onOpenCba?.(); onClose(); }}>
            <span className={classes.actionIcon}><IconCommentary size={22} /></span>
            <span className={classes.actionLabel}>Ver Comentario (CBA)</span>
          </button>

          <button className={classes.mainAction} onClick={handleBookmark}>
            <span className={classes.actionIcon}><IconBookmark size={22} /></span>
            <span className={classes.actionLabel}>{bookmarked ? 'Quitar Marcador' : 'Añadir Marcador'}</span>
          </button>

          <button className={classes.mainAction} onClick={handleShare}>
            <span className={classes.actionIcon}><IconShare size={22} /></span>
            <span className={classes.actionLabel}>Compartir versículo</span>
          </button>

          <div className={classes.divider} />

          <div className={classes.colorSection}>
            <span className={classes.sectionLabel}>Resaltar con color</span>
            <div className={classes.colorGrid}>
               <button aria-label="Limpiar color" className={`${classes.colorBtn} ${classes.colorClear}`} onClick={() => handleHighlight(null)}>✕</button>
               <button aria-label="Promesa" title="Promesa" className={`${classes.colorBtn} ${classes.colorRed}`} onClick={() => handleHighlight('red')} />
               <button aria-label="Sabiduria" title="Sabiduria" className={`${classes.colorBtn} ${classes.colorGold}`} onClick={() => handleHighlight('gold')} />
               <button aria-label="Ensenanza" title="Ensenanza" className={`${classes.colorBtn} ${classes.colorBlue}`} onClick={() => handleHighlight('blue')} />
               <button aria-label="Aplicacion" title="Aplicacion" className={`${classes.colorBtn} ${classes.colorGreen}`} onClick={() => handleHighlight('green')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
