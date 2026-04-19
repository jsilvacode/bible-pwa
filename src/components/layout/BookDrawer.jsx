import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBooksManifest } from '../../services/bibleLoader';
import classes from './BookDrawer.module.css';

export default function BookDrawer({ isOpen, onClose }) {
  const [books, setBooks] = useState([]);
  const [expandedBook, setExpandedBook] = useState(null);
  const [isOtOpen, setIsOtOpen] = useState(false);
  const [isNtOpen, setIsNtOpen] = useState(false);
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
    <div className={`${classes.drawerOverlay} ${isOpen ? classes.open : ''}`} onClick={onClose}>
      <div className={classes.drawer} onClick={e => e.stopPropagation()}>
        <header className={classes.header}>
          <div className={classes.headerContent}>
            <h2>Índice</h2>
            <button className={classes.closeBtn} onClick={onClose}>✕</button>
          </div>
        </header>

        <div className={classes.scrollArea}>
          <section className={classes.section}>
            <button
              className={classes.sectionToggle}
              onClick={() => setIsOtOpen(prev => !prev)}
              type="button"
            >
              <h3 className={classes.sectionTitle}>Antiguo Testamento</h3>
              <span className={classes.sectionChevron}>{isOtOpen ? '▾' : '▸'}</span>
            </button>
            <div className={classes.bookGrid}>
              {isOtOpen && renderBookList(otBooks)}
            </div>
          </section>

          <section className={classes.section}>
            <button
              className={classes.sectionToggle}
              onClick={() => setIsNtOpen(prev => !prev)}
              type="button"
            >
              <h3 className={classes.sectionTitle}>Nuevo Testamento</h3>
              <span className={classes.sectionChevron}>{isNtOpen ? '▾' : '▸'}</span>
            </button>
            <div className={classes.bookGrid}>
              {isNtOpen && renderBookList(ntBooks)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
