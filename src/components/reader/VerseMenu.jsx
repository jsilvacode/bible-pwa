import React from 'react';
import classes from './VerseMenu.module.css';

export default function VerseMenu({ verse, onClose }) {
  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.menu} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h3>Versículo {verse}</h3>
        </div>
        <div className={classes.actions}>
          <button onClick={() => { alert('Comentario próximamente'); onClose(); }}>📑 Comentario</button>
          <button onClick={() => { alert('Marcador próximamente'); onClose(); }}>🔖 Marcar</button>
          <button onClick={() => { alert('Nota próximamente'); onClose(); }}>✏️ Nota</button>
          <button onClick={() => { alert('Resaltar próximamente'); onClose(); }}>🎨 Resaltar</button>
          <button onClick={() => { alert('Compartir próximamente'); onClose(); }}>📤 Compartir</button>
        </div>
      </div>
    </div>
  );
}
