import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBooksManifest } from '../../services/bibleLoader';
import classes from './BookDrawer.module.css';

export default function BookDrawer({ isOpen, onClose }) {
  const [books, setBooks] = useState([]);
  const [expandedBook, setExpandedBook] = useState(null);
  const [isOtOpen, setIsOtOpen] = useState(true);
  const [isNtOpen, setIsNtOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && books.length === 0) {
      fetchBooksManifest().then(setBooks).catch(console.error);
    }
  }, [isOpen, books.length]);

  const handleBookClick = (bookId) => {
    setExpandedBook(expandedBook === bookId ? null : bookId);
  };

  const handleChapterClick = (bookId, chapter) => {
    navigate(`/read/${bookId}/${chapter}`);
    onClose();
  };

  if (!isOpen) return null;

  const otBooks = books.filter(b => b.testament === 'OT');
  const ntBooks = books.filter(b => b.testament === 'NT');

  const renderBookList = (list) => (
    list.map(b => (
      <div key={b.id} className={classes.bookItem}>
        <div 
          className={classes.bookName} 
          onClick={() => handleBookClick(b.id)}
        >
          {b.name}
        </div>
        {expandedBook === b.id && (
          <div className={classes.chaptersGrid}>
            {Array.from({length: b.chapters}, (_, i) => i + 1).map(c => (
              <button 
                key={c} 
                onClick={() => handleChapterClick(b.id, c)}
                className={classes.chapterBtn}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className={classes.drawerOverlay} onClick={onClose}>
      <div className={classes.drawer} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h2>Índice de Libros</h2>
          <button className={classes.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={classes.scrollArea}>
          <button
            className={classes.sectionToggle}
            onClick={() => setIsOtOpen(prev => !prev)}
            type="button"
          >
            <span className={classes.sectionTitle}>Antiguo Testamento</span>
            <span className={classes.sectionChevron}>{isOtOpen ? '▾' : '▸'}</span>
          </button>
          {isOtOpen && renderBookList(otBooks)}

          <button
            className={classes.sectionToggle}
            onClick={() => setIsNtOpen(prev => !prev)}
            type="button"
          >
            <span className={classes.sectionTitle}>Nuevo Testamento</span>
            <span className={classes.sectionChevron}>{isNtOpen ? '▾' : '▸'}</span>
          </button>
          {isNtOpen && renderBookList(ntBooks)}
        </div>
      </div>
    </div>
  );
}
