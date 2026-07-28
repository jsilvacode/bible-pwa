import React, { useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import { useRecentReads } from '../../hooks/useSettings';
import { useBookNames } from '../../hooks/useBookNames';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconUser } from '../ui/Icons';
import classes from './HomeScreen.module.css';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const { bookNames } = useBookNames();
  const { openSearch } = useGlobalSearch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const handleSearch = (event) => {
    event.preventDefault();
    openSearch(searchQuery.trim());
  };

  return (
    <div className={classes.container}>
      <div className={classes.topHero}>
        <header className={classes.header}>
          <div className={classes.headerTop}>
            <div className={classes.userInfo}>
              <div className={classes.avatar}>
                <IconUser size={22} />
              </div>
              <div className={classes.greetingWrap}>
                <span className={classes.date}>
                  {new Date().toLocaleDateString('es', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
                <h1 className={classes.greeting}>{greeting}</h1>
              </div>
            </div>
          </div>

          <form className={classes.searchModule} onSubmit={handleSearch} role="search">
            <div className={classes.searchBar}>
              <IconSearch size={20} className={classes.searchIcon} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Busca en la Biblia"
                aria-label="Buscar en la Santa Biblia"
                autoComplete="off"
              />
            </div>

            <button type="submit" className={classes.searchSubmit} aria-label="Buscar">
              <span>Buscar</span>
              <span className={classes.searchArrow} aria-hidden="true">→</span>
            </button>

            <p className={classes.searchSuggestion}>
              <span>Prueba con referencias o palabras</span>
              <span className={classes.suggestionExample}>Ej: 1 Corintios, Juan 3:16, justificación</span>
            </p>
          </form>
        </header>

        <DailyVerse variant="hero" />
      </div>

      <div className={classes.bottomSheet}>
        <section className={`${classes.section} ${classes.firstSection}`}>
          <h3 className={classes.sectionTitle}>Navegar la Biblia</h3>
          <CategoryGrid />
        </section>

        {recent.length > 0 && (
          <section className={classes.section}>
            <div className={classes.sectionHeading}>
              <h3 className={classes.sectionTitle}>Lecturas recientes</h3>
              <p>Retoma un capítulo donde lo dejaste</p>
            </div>
            <div className={classes.recentScroll}>
              {recent.map((r) => (
                <button
                  key={`${r.book}-${r.chapter}`}
                  type="button"
                  className={classes.recentChip}
                  onClick={() => navigate(`/read/${r.book}/${r.chapter}`)}
                >
                  <span className={classes.recentEyebrow}>Última lectura</span>
                  <strong className={classes.recentBook}>{bookNames[r.book] || `Libro ${r.book}`}</strong>
                  <span className={classes.recentChapter}>Capítulo {r.chapter} <span aria-hidden="true">→</span></span>
                </button>
              ))}
            </div>
          </section>
        )}

        <ReadingStreak />
      </div>
    </div>
  );
}
