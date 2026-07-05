import React, { useState, useEffect, useRef } from 'react';
import { loadCbaVerse } from '../../services/cbaLoader';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import classes from './CbaModal.module.css';

export default function CbaModal({ isOpen, onClose, bookId, chapter, verse, bookName }) {
  const [content, setContent] = useState('');
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
      try {
        const commentary = await loadCbaVerse(bookId, chapter, verse, {
          signal: controller.signal,
        });
        setContent(commentary || 'No hay un comentario específico para este versículo.');
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching CBA', err);
        setContent('Error al cargar el comentario.');
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
          ) : (
            <div className={classes.content}>
              {content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
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
