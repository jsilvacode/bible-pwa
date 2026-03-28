import React, { useState } from 'react';
import classes from './CommentaryPopup.module.css';

export default function CommentaryPopup({ verse, onClose }) {
  const [activeTab, setActiveTab] = useState('henry');

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.popup} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h3>Comentario para versículo {verse}</h3>
          <button className={classes.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={classes.tabs}>
          <button 
            className={`${classes.tabBtn} ${activeTab === 'henry' ? classes.active : ''}`} 
            onClick={() => setActiveTab('henry')}
          >
            Matthew Henry
          </button>
          <button 
            className={`${classes.tabBtn} ${activeTab === 'jfb' ? classes.active : ''}`} 
            onClick={() => setActiveTab('jfb')}
          >
            JFB
          </button>
          <button 
            className={`${classes.tabBtn} ${activeTab === 'egw' ? classes.active : ''}`} 
            onClick={() => setActiveTab('egw')}
          >
            EGW
          </button>
        </div>

        <div className={classes.content}>
          <p className={classes.placeholder}>
            Comentarios disponibles próximamente en la versión 1.1 de la PWA.
          </p>
        </div>
      </div>
    </div>
  );
}
