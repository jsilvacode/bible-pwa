import React from 'react';
import classes from './VerseMenu.module.css';
import { useBookmarks } from '../../hooks/useBookmarks';

export default function VerseMenu({ verse, payload, onClose }) {
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

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.sheet} onClick={e => e.stopPropagation()}>
        <div className={classes.handle} />
        
        <header className={classes.header}>
          <h3>Versículo {verse}</h3>
          <button className={classes.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={classes.actions}>
          <button className={classes.mainAction} onClick={handleBookmark}>
            <span className={classes.actionIcon}>{bookmarked ? '🔖' : '📑'}</span>
            <span className={classes.actionLabel}>{bookmarked ? 'Quitar Marcador' : 'Añadir Marcador'}</span>
          </button>
          
          <button className={classes.mainAction} onClick={handleShare}>
            <span className={classes.actionIcon}>📤</span>
            <span className={classes.actionLabel}>Compartir versículo</span>
          </button>

          <div className={classes.divider} />

          <div className={classes.colorSection}>
            <span className={classes.sectionLabel}>Resaltar con color</span>
            <div className={classes.colorGrid}>
               <button aria-label="Limpiar color" className={classes.colorBtn} style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => handleHighlight(null)}>✕</button>
               <button aria-label="Promesa" title="Promesa" className={classes.colorBtn} style={{ background: 'var(--highlight-red)' }} onClick={() => handleHighlight('red')} />
               <button aria-label="Sabiduria" title="Sabiduria" className={classes.colorBtn} style={{ background: 'var(--highlight-gold)' }} onClick={() => handleHighlight('gold')} />
               <button aria-label="Ensenanza" title="Ensenanza" className={classes.colorBtn} style={{ background: 'var(--highlight-blue)' }} onClick={() => handleHighlight('blue')} />
               <button aria-label="Aplicacion" title="Aplicacion" className={classes.colorBtn} style={{ background: 'var(--highlight-green)' }} onClick={() => handleHighlight('green')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
