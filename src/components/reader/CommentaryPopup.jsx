import React, { useState, useEffect } from 'react';
import { useEGW } from '../../hooks/useEGW';
import { fetchBooksManifest } from '../../services/bibleLoader';
import classes from './CommentaryPopup.module.css';

function cleanHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/(<([^>]+)>)/gi, '').replace(/\s+/g, ' ').trim();
}

function normalizeResults(response) {
  if (!response) return [];
  const candidates = response.results || response.items || response.hits || response.data || [];
  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((item, idx) => ({
      id: item.id || item.uuid || item.pk || idx,
      title: item.book_title || item.title || item.publication_title || 'Escritos de EGW',
      content: cleanHtml(item.content || item.snippet || item.text || item.description || ''),
      page: item.page || item.page_label || item.page_number || '',
    }))
    .filter(item => item.content.length > 0)
    .slice(0, 5);
}

export default function CommentaryPopup({ verseData, verse, verseText, onClose }) {
  const [activeTab, setActiveTab] = useState('egw');
  const { token, login, fetchWithCache } = useEGW();
  const [egwData, setEgwData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'egw' && token) {
      const fetchEgw = async () => {
        setLoading(true);
        setError(null);
        try {
          const books = await fetchBooksManifest();
          const bookInfo = books.find(b => b.id === verseData.book);
          const reference = `${bookInfo?.name || `Libro ${verseData.book}`} ${verseData.chapter}:${verse}`;
          const seedText = verseText?.slice(0, 90) || reference;

          const responseByText = await fetchWithCache(`/search/?query=${encodeURIComponent(seedText)}&lang=es&limit=5`);
          let normalized = normalizeResults(responseByText);

          if (normalized.length === 0) {
            const responseByRef = await fetchWithCache(`/search/?query=${encodeURIComponent(reference)}&lang=es&limit=5`);
            normalized = normalizeResults(responseByRef);
          }

          setEgwData(normalized);
        } catch (e) {
          setError(e.message);
          setEgwData([]);
        }
        setLoading(false);
      };
      fetchEgw();
    }
  }, [activeTab, token, verseData, verse, verseText, fetchWithCache]);

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.popup} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h3>Comentario para versículo {verse}</h3>
          <button className={classes.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={classes.tabs}>
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
            ) : egwData.length > 0 ? (
              <div className={classes.egwResult}>
                {egwData.map((r) => (
                  <div key={r.id} className={classes.egwQuote}>
                    <p>"{r.content}"</p>
                    <small>— {r.title}{r.page ? `, p. ${r.page}` : ''}</small>
                  </div>
                ))}
              </div>
            ) : null
          ) : (
            <p className={classes.placeholder}>
              Comentarios disponibles próximamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
