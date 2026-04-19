import React from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './CategoryGrid.module.css';

const CATEGORIES = [
  { id: 'pentateuch', name: 'Pentateuco', icon: '📜', count: '5 libros', color: 'var(--cat-pentateuch)', image: '/images/categories/pentateuch.png' },
  { id: 'historical', name: 'Libros Históricos', icon: '⚔️', count: '12 libros', color: 'var(--cat-historical)', image: '/images/categories/historical.png' },
  { id: 'wisdom', name: 'Salmos y Sabiduría', icon: '🎵', count: '5 libros', color: 'var(--cat-wisdom)', image: '/images/categories/wisdom.png' },
  { id: 'prophets', name: 'Profetas', icon: '📣', count: '17 libros', color: 'var(--cat-prophets)', image: '/images/categories/prophets.png' },
  { id: 'gospels', name: 'Evangelios y Hechos', icon: '✝️', count: '5 libros', color: 'var(--cat-gospels)', image: '/images/categories/gospels.png' },
  { id: 'epistles', name: 'Epístolas y Apoc.', icon: '✉️', count: '22 libros', color: 'var(--cat-epistles)', image: '/images/categories/epistles.png' },
];

export default function CategoryGrid() {
  const navigate = useNavigate();

  const handleClick = (cat) => {
    // Navigate to BibleBrowser page and pass category as navigation state
    navigate('/bible', { state: { category: cat.id } });
  };

  return (
    <div className={classes.grid}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={classes.card}
          style={{ 
            backgroundColor: cat.color,
            '--bg-image': `url(${cat.image})`
          }}
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
