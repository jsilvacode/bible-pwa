import React, { useState, useEffect } from 'react';
import { useEGW } from '../../hooks/useEGW';
import { fetchBooksManifest } from '../../services/bibleLoader';
import classes from './CommentaryPopup.module.css';

export default function CommentaryPopup({ verseData, verse, onClose }) {
  const [activeTab, setActiveTab] = useState('henry');
  const { token, login, fetchWithCache } = useEGW();
  const [egwData, setEgwData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'egw' && token && !egwData) {
      const fetchEgw = async () => {
        setLoading(true);
        setError(null);
        try {
          const books = await fetchBooksManifest();
          // Obtener el libro desde verseData
          const bookInfo = books.find(b => b.id === verseData.book);
          const ref = `${bookInfo.name} ${verseData.chapter}:${verse}`;
          
          const response = await fetchWithCache(`/search/?query=${encodeURIComponent(ref)}&lang=es`);
          // Si el api retorna un arreglo, tomamos el primer hit, si no hay mostramos texto vacío
          setEgwData(response);
        } catch (e) {
          setError(e.message);
        }
        setLoading(false);
      };
      fetchEgw();
    }
  }, [activeTab, token, verseData, verse, egwData, fetchWithCache]);

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
          {activeTab === 'egw' ? (
            !token ? (
              <div className={classes.authRequired}>
                <p>Para ver los comentarios de EGW Writings debes conectar tu cuenta.</p>
                <button className={classes.loginBtn} onClick={login}>Conectar EGW</button>
              </div>
            ) : loading ? (
              <p>Buscando en los escritos...</p>
            ) : error ? (
              <p>Error: {error === 'NO_TOKEN' ? 'Sesión expirada' : error}</p>
            ) : egwData ? (
              <div className={classes.egwResult}>
                {egwData.results?.length > 0 ? (
                  egwData.results.slice(0, 3).map((r, i) => (
                    <div key={i} className={classes.egwQuote}>
                      <p>"{typeof r.content === 'string' ? r.content.replace(/(<([^>]+)>)/gi, "") : 'Cita extraída'}"</p>
                      <small>— {r.book_title || 'Escritos de EGW'}, p. {r.page}</small>
                    </div>
                  ))
                ) : (
                  <p>No se encontraron comentarios directos.</p>
                )}
              </div>
            ) : null
          ) : (
            <p className={classes.placeholder}>
              Comentarios disponibles próximamente en la versión 1.1 de la PWA.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
