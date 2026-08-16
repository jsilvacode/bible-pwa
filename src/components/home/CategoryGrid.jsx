import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BIBLE_CATEGORIES } from '../../constants/bibleCategories';
import { IconBook } from '../ui/Icons';
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

  const renderCard = (cat) => (
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
  );

  return (
    <div className={classes.explorer}>
      <div className={classes.atlasMark} aria-hidden="true">
        <IconBook size={16} />
        <strong>66</strong>
        <span>libros</span>
      </div>

      <div className={classes.groupLabel}>
        <span>Comienza por un testamento</span>
        <i aria-hidden="true" />
      </div>
      <div className={`${classes.grid} ${classes.testamentGrid}`}>
        {TESTAMENT_ENTRIES.map(renderCard)}
      </div>

      <div className={`${classes.groupLabel} ${classes.collectionLabel}`}>
        <span>O explora por colección</span>
        <i aria-hidden="true" />
      </div>
      <div className={`${classes.grid} ${classes.categoryGrid}`}>
        {BIBLE_CATEGORIES.map(renderCard)}
      </div>
    </div>
  );
}
