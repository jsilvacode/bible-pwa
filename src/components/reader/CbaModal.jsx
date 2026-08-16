import React, { useState, useEffect, useRef } from 'react';
import { loadCbaVerse } from '../../services/cbaLoader';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import classes from './CbaModal.module.css';

export default function CbaModal({ isOpen, onClose, bookId, chapter, verse, bookName }) {
  const [commentary, setCommentary] = useState(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  useFocusTrap(modalRef, isOpen);
  useModalDismiss(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !bookId || !chapter || !verse) {
      return;
    }

    const controller = new AbortController();

    async function fetchCba() {
      setLoading(true);
      setCommentary(null);
      try {
        const entry = await loadCbaVerse(bookId, chapter, verse, {
          signal: controller.signal,
        });
        setCommentary(entry);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching CBA', err);
        setCommentary({ review: 'load-error', blocks: [] });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchCba();
    return () => controller.abort();
  }, [isOpen, bookId, chapter, verse]);

  if (!isOpen) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div
        className={classes.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cba-modal-title"
      >
        <div className={classes.header}>
          <div className={classes.titleGroup}>
            <h3 className={classes.title} id="cba-modal-title">Comentario Bíblico</h3>
            <p className={classes.subtitle}>
              {bookName} {chapter}:{verse}
            </p>
          </div>
          <button type="button" className={classes.closeBtn} onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={classes.body}>
          {loading ? (
            <div className={classes.loading}>Cargando comentario...</div>
          ) : commentary?.blocks?.length ? (
            <div className={classes.content}>
              {commentary.blocks.map((block, index) => (
                block.type === 'heading' ? (
                  <h4 key={`${block.text}-${index}`}>{block.text}</h4>
                ) : (
                  <p key={`${block.text.slice(0, 40)}-${index}`}>{block.text}</p>
                )
              ))}
            </div>
          ) : (
            <div className={classes.empty} role="status">
              {commentary?.review === 'source-unavailable'
                ? 'Este comentario está en revisión editorial para preservar la fidelidad del texto.'
                : commentary?.review === 'load-error'
                  ? 'No fue posible cargar el comentario. Inténtalo nuevamente.'
                  : 'No hay un comentario específico para este versículo.'}
            </div>
          )}
        </div>

        <div className={classes.footer}>
          <p className={classes.disclaimer}>Fuente: Comentario Bíblico Adventista (CBA)</p>
        </div>
      </div>
    </div>
  );
}
