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

export default function CategoryGrid() {
  const navigate = useNavigate();

  const handleClick = useCallback((cat) => {
    navigate('/bible', { state: { category: cat.id } });
  }, [navigate]);

  return (
    <div className={classes.grid}>
      {BIBLE_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`${classes.card} ${categoryClassMap[cat.id] || ''}`}
          onClick={() => handleClick(cat)}
        >
          <span className={classes.icon}>{cat.icon}</span>
          <div className={classes.info}>
            <span className={classes.name}>{cat.name}</span>
            <span className={classes.count}>{cat.count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
