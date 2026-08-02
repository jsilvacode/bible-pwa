import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BIBLE_CATEGORIES } from '../../constants/bibleCategories';
import classes from './CategoryGrid.module.css';

const categoryClassMap = {
  pentateuch: classes.catPentateuch,
  historical: classes.catHistorical,
  wisdom: classes.catWisdom,
  prophets: classes.catProphets,
  gospels: classes.catGospels,
  epistles: classes.catEpistles,
};

const TESTAMENT_ENTRIES = [
  {
    id: 'old-testament',
    name: 'Antiguo Testamento',
    icon: 'AT',
    count: '39 libros',
    testament: 'old',
    className: classes.testamentOld,
  },
  {
    id: 'new-testament',
    name: 'Nuevo Testamento',
    icon: 'NT',
    count: '27 libros',
    testament: 'new',
    className: classes.testamentNew,
  },
];

export default function CategoryGrid() {
  const navigate = useNavigate();

  const handleClick = useCallback((cat) => {
    const state = cat.testament
      ? { testament: cat.testament }
      : { category: cat.id };
    navigate('/bible', { state });
  }, [navigate]);

  const entries = [...TESTAMENT_ENTRIES, ...BIBLE_CATEGORIES];

  return (
    <div className={classes.grid}>
      {entries.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`${classes.card} ${cat.testament ? classes.testamentCard : classes.categoryCard} ${cat.className || categoryClassMap[cat.id] || ''}`}
          aria-label={`Explorar ${cat.name}, ${cat.count}`}
          onClick={() => handleClick(cat)}
        >
          <span className={`${classes.icon} ${cat.testament ? classes.testamentIcon : ''}`} aria-hidden="true">{cat.icon}</span>
          <div className={classes.info}>
            <span className={classes.name}>{cat.name}</span>
            <span className={classes.count}>{cat.count}</span>
          </div>
          <span className={classes.cardAction} aria-hidden="true">Explorar <span>→</span></span>
        </button>
      ))}
    </div>
  );
}
