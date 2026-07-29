import React, { useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import { useRecentReads } from '../../hooks/useSettings';
import { useBookNames } from '../../hooks/useBookNames';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { IconMoon, IconSearch, IconSun, IconSunrise } from '../ui/Icons';
import classes from './HomeScreen.module.css';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const { bookNames } = useBookNames();
  const { openSearch } = useGlobalSearch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const period = hour < 12 ? 'morning' : hour < 20 ? 'afternoon' : 'night';
  const GreetingIcon = period === 'morning' ? IconSunrise : period === 'afternoon' ? IconSun : IconMoon;
  const formattedDate = now
    .toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '');
  const dateTime = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const handleSearch = (event) => {
    event.preventDefault();
    openSearch(searchQuery.trim());
  };

  return (
    <div className={classes.container}>
      <div className={classes.topHero}>
        <header className={classes.header}>
          <div className={classes.headerTop}>
            <div className={classes.greetingGroup}>
              <div className={`${classes.timeIcon} ${classes[period]}`}>
                <GreetingIcon size={22} />
              </div>
              <h1 className={classes.greeting}>{greeting}</h1>
            </div>

            <span className={classes.headerDivider} aria-hidden="true" />
            <time className={classes.date} dateTime={dateTime}>
              {formattedDate}
            </time>
          </div>

        </header>

        <DailyVerse variant="hero">
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
        </DailyVerse>
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
