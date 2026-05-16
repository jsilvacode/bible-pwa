import React, { useState, useEffect } from 'react';
import classes from './CbaModal.module.css';

export default function CbaModal({ isOpen, onClose, bookId, chapter, verse, bookName }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bookId && chapter && verse) {
      async function fetchCba() {
        setLoading(true);
        try {
          const response = await fetch(`/data/cba/${bookId}.json`);
          if (!response.ok) {
            setContent("No se encontró el archivo de comentarios.");
            return;
          }
          const data = await response.json();
          // Access with string keys to be safe
          const chapterData = data[String(chapter)];
          const commentary = chapterData ? chapterData[String(verse)] : null;
          
          setContent(commentary || "No hay un comentario específico para este versículo.");
        } catch (err) {
          console.error("Error fetching CBA", err);
          setContent("Error al cargar el comentario.");
        } finally {
          setLoading(false);
        }
      }
      fetchCba();
    }
  }, [isOpen, bookId, chapter, verse]);

  if (!isOpen) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <div className={classes.titleGroup}>
            <h3 className={classes.title}>Comentario Bíblico</h3>
            <p className={classes.subtitle}>{bookName} {chapter}:{verse}</p>
          </div>
          <button className={classes.closeBtn} onClick={onClose}>&times;</button>
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
