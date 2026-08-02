import React, { useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import { useRecentReads } from '../../hooks/useSettings';
import { useBookNames } from '../../hooks/useBookNames';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { IconBook, IconChevronRight, IconMoon, IconSearch, IconSun, IconSunrise } from '../ui/Icons';
import classes from './HomeScreen.module.css';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Sin fecha registrada';

  const elapsedSeconds = Math.round((Date.now() - timestamp) / 1000);
  const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (elapsedSeconds < 60) return 'Hace un momento';
  if (elapsedSeconds < 3600) return relative.format(-Math.round(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 86400) return relative.format(-Math.round(elapsedSeconds / 3600), 'hour');
  return relative.format(-Math.round(elapsedSeconds / 86400), 'day');
}

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
          <div className={classes.sectionHeading}>
            <span className={classes.sectionKicker}>Explora las Escrituras</span>
            <h3 className={classes.sectionTitle}>Navegar la Biblia</h3>
            <p>Encuentra un testamento, género o colección para comenzar.</p>
          </div>
          <CategoryGrid />
        </section>

        <section className={`${classes.section} ${classes.recentSection}`} aria-labelledby="continue-reading-title">
          <div className={classes.sectionHeading}>
            <div>
              <span className={classes.sectionKicker}>Tu camino de lectura</span>
              <h3 id="continue-reading-title" className={classes.sectionTitle}>Continúa tu camino</h3>
              <p>Retoma una lectura y vuelve al ritmo que habías comenzado.</p>
            </div>
          </div>

          {recent.length > 0 ? (
            <>
              {(() => {
                const latest = recent[0];
                const latestBookName = bookNames[latest.book] || `Libro ${latest.book}`;

                return (
                  <button
                    type="button"
                    className={classes.recentHero}
                    onClick={() => navigate(`/read/${latest.book}/${latest.chapter}`)}
                    aria-label={`Continuar leyendo ${latestBookName}, capítulo ${latest.chapter}`}
                  >
                    <span className={classes.recentHeroIcon} aria-hidden="true">
                      <IconBook size={25} />
                    </span>
                    <span className={classes.recentHeroContent}>
                      <span className={classes.recentHeroEyebrow}>Última lectura</span>
                      <strong className={classes.recentHeroBook}>{latestBookName}</strong>
                      <span className={classes.recentHeroChapter}>
                        Capítulo {latest.chapter} · {formatRelativeTime(latest.ts)}
                      </span>
                    </span>
                    <span className={classes.recentHeroCta}>
                      Continuar
                      <IconChevronRight size={18} />
                    </span>
                  </button>
                );
              })()}

              {recent.length > 1 && (
                <div className={classes.recentTrail} aria-label="Últimas lecturas">
                  {recent.slice(1).map((r) => {
                    const bookName = bookNames[r.book] || `Libro ${r.book}`;
                    return (
                      <button
                        key={`${r.book}-${r.chapter}`}
                        type="button"
                        className={classes.recentItem}
                        onClick={() => navigate(`/read/${r.book}/${r.chapter}`)}
                        aria-label={`Abrir ${bookName}, capítulo ${r.chapter}, ${formatRelativeTime(r.ts)}`}
                      >
                        <span className={classes.recentItemMarker} aria-hidden="true" />
                        <span className={classes.recentItemContent}>
                          <strong>{bookName}</strong>
                          <span>Capítulo {r.chapter}</span>
                          <small>{formatRelativeTime(r.ts)}</small>
                        </span>
                        <IconChevronRight size={17} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={classes.recentEmpty}>
              <span className={classes.recentEmptyIcon} aria-hidden="true">
                <IconBook size={23} />
              </span>
              <div>
                <strong>Tu camino comienza aquí</strong>
                <p>Abre un capítulo y tus lecturas aparecerán en este espacio.</p>
              </div>
              <button type="button" className={classes.recentEmptyCta} onClick={() => navigate('/bible')}>
                Explorar la Biblia
                <IconChevronRight size={17} />
              </button>
            </div>
          )}
        </section>

        <ReadingStreak />
      </div>
    </div>
  );
}
