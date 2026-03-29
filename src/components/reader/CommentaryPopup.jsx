import React, { useMemo, useState, useEffect } from 'react';
import { useEGW } from '../../hooks/useEGW';
import { fetchBooksManifest } from '../../services/bibleLoader';
import classes from './CommentaryPopup.module.css';

const THEME_LIBRARY = [
  {
    id: 'fe',
    title: 'Fe y confianza',
    keywords: ['fe', 'confiar', 'esperar', 'promesa', 'firme', 'creer'],
    note: 'EGW enfatiza que la fe práctica se fortalece cuando descansamos en las promesas de Dios aun en la incertidumbre.',
  },
  {
    id: 'amor',
    title: 'Amor y gracia',
    keywords: ['amor', 'gracia', 'misericordia', 'perdon', 'compasion', 'bondad'],
    note: 'La gracia transforma la relación con Dios y con otros; el amor cristiano se expresa en actos concretos.',
  },
  {
    id: 'oracion',
    title: 'Oración y comunión',
    keywords: ['orar', 'oracion', 'pedid', 'buscar', 'espiritu', 'comunion'],
    note: 'La oración perseverante prepara el corazón para discernir la voluntad divina y recibir dirección.',
  },
  {
    id: 'obediencia',
    title: 'Obediencia y carácter',
    keywords: ['obedecer', 'mandamiento', 'justicia', 'santidad', 'camino', 'verdad'],
    note: 'La obediencia, según EGW, no es legalismo sino fruto del amor a Cristo y formación de carácter.',
  },
  {
    id: 'esperanza',
    title: 'Esperanza y consuelo',
    keywords: ['esperanza', 'consuelo', 'paz', 'gozo', 'animo', 'fortaleza'],
    note: 'En pruebas, los escritos de EGW suelen apuntar a la esperanza en Cristo como ancla del alma.',
  },
];

function stripAccents(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

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

function getTopicMatches(verseText = '', reference = '') {
  const haystack = stripAccents(`${reference} ${verseText}`);
  const matches = THEME_LIBRARY
    .map(theme => {
      const score = theme.keywords.reduce((acc, keyword) => {
        const token = stripAccents(keyword);
        return haystack.includes(token) ? acc + 1 : acc;
      }, 0);
      return { ...theme, score };
    })
    .filter(theme => theme.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (matches.length > 0) return matches;
  return [
    {
      id: 'general',
      title: 'Reflexión espiritual',
      note: 'Este versículo puede estudiarse buscando contexto, promesas y aplicación práctica en la vida diaria.',
      score: 0,
    },
  ];
}

export default function CommentaryPopup({ verseData, verse, verseText, onClose }) {
  const [activeTab, setActiveTab] = useState('temas');
  const { token, login, fetchWithCache } = useEGW();
  const [egwData, setEgwData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const topics = useMemo(() => {
    const reference = `${verseData.book}:${verseData.chapter}:${verse}`;
    return getTopicMatches(verseText, reference);
  }, [verseData.book, verseData.chapter, verse, verseText]);

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
            className={`${classes.tabBtn} ${activeTab === 'temas' ? classes.active : ''}`} 
            onClick={() => setActiveTab('temas')}
          >
            Temas
          </button>
          <button 
            className={`${classes.tabBtn} ${activeTab === 'egw' ? classes.active : ''}`} 
            onClick={() => setActiveTab('egw')}
          >
            EGW (cuenta)
          </button>
        </div>

        <div className={classes.content}>
          {activeTab === 'temas' ? (
            <div className={classes.egwResult}>
              {topics.map((topic) => (
                <div key={topic.id} className={classes.egwQuote}>
                  <p>{topic.note}</p>
                  <small>— Tema sugerido: {topic.title}</small>
                </div>
              ))}
              <p className={classes.helperText}>
                Estas coincidencias son orientativas. Para citas textuales, usa la pestaña EGW con tu cuenta conectada.
              </p>
            </div>
          ) : (
            !token ? (
              <div className={classes.authRequired}>
                <p>Para ver resultados directos de EGW Writings debes conectar tu cuenta.</p>
                <button className={classes.loginBtn} onClick={login}>Conectar EGW</button>
              </div>
            ) : loading ? (
              <p>Buscando en los escritos...</p>
            ) : error ? (
              <div className={classes.authRequired}>
                <p>Error: {error === 'NO_TOKEN' ? 'Sesión expirada' : 'No fue posible consultar EGW en este momento.'}</p>
                <p className={classes.helperText}>Puedes seguir usando la pestaña "Temas" sin conexión a EGW.</p>
              </div>
            ) : egwData.length > 0 ? (
              <div className={classes.egwResult}>
                {egwData.map((r) => (
                  <div key={r.id} className={classes.egwQuote}>
                    <p>"{r.content}"</p>
                    <small>— {r.title}{r.page ? `, p. ${r.page}` : ''}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className={classes.placeholder}>No se encontraron resultados directos para este versículo.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
