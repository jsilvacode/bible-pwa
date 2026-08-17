import React, { useEffect, useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import { useRecentReads } from '../../hooks/useSettings';
import { useBookNames } from '../../hooks/useBookNames';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { IconBook, IconChevronRight, IconMoon, IconSearch, IconSun, IconSunrise } from '../ui/Icons';
import classes from './HomeScreen.module.css';

const HERO_IMAGE_SRC = '/assets/hero-768.webp';
const HERO_IMAGE_SRC_SET = '/assets/hero-768.webp 768w, /assets/hero-1600.webp 1600w';
const HERO_IMAGE_SIZES = '(max-width: 768px) 100vw, 1024px';

let heroImageDecoded = false;
let heroImagePromise;

function preloadHeroImage() {
  if (heroImageDecoded || typeof Image === 'undefined') return Promise.resolve();
  if (heroImagePromise) return heroImagePromise;

  const image = new Image();
  image.srcSet = HERO_IMAGE_SRC_SET;
  image.sizes = HERO_IMAGE_SIZES;

  heroImagePromise = new Promise((resolve) => {
    const finish = () => {
      heroImageDecoded = true;
      resolve();
    };

    const decode = async () => {
      try {
        await image.decode?.();
      } catch {
        // A completed image can reject decode() in some browsers; it is still safe to paint.
      }
      finish();
    };

    image.addEventListener('load', decode, { once: true });
    image.addEventListener('error', finish, { once: true });
    image.src = HERO_IMAGE_SRC;

    if (image.complete) decode();
  });

  return heroImagePromise;
}

function useHeroImageReady() {
  const [isReady, setIsReady] = useState(heroImageDecoded);

  useEffect(() => {
    let isMounted = true;

    preloadHeroImage().then(() => {
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return isReady;
}

preloadHeroImage();

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
  const isHeroImageReady = useHeroImageReady();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const period = hour < 12 ? 'morning' : hour < 20 ? 'afternoon' : 'night';
  const GreetingIcon = period === 'morning' ? IconSunrise : period === 'afternoon' ? IconSun : IconMoon;
  const latest = recent[0];
  const latestBookName = latest ? bookNames[latest.book] || `Libro ${latest.book}` : '';

  const handleSearch = (event) => {
    event.preventDefault();
    openSearch(searchQuery.trim());
  };

  return (
    <div className={classes.container}>
      <div className={`${classes.topHero} ${isHeroImageReady ? classes.heroImageReady : ''}`}>
        <img
          className={classes.heroImage}
          src={HERO_IMAGE_SRC}
          srcSet={HERO_IMAGE_SRC_SET}
          sizes={HERO_IMAGE_SIZES}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        <header className={classes.header}>
          <div className={classes.headerTop}>
            <div className={classes.greetingGroup}>
              <div className={`${classes.timeIcon} ${classes[period]}`}>
                <GreetingIcon size={22} />
              </div>
              <h1 className={classes.greeting}>{greeting}</h1>
            </div>
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
        <section className={`${classes.section} ${classes.firstSection}`} aria-labelledby="explore-scriptures-title">
          <div className={`${classes.sectionHeading} ${classes.exploreHeading}`}>
            <h2 id="explore-scriptures-title" className={classes.sectionTitle}>Explora las Escrituras</h2>
            <p>Encuentra un testamento, género o colección para comenzar.</p>
          </div>
          <CategoryGrid />
        </section>

        <section className={`${classes.section} ${classes.recentSection}`} aria-labelledby="continue-reading-title">
          <div className={`${classes.sectionHeading} ${classes.exploreHeading}`}>
            <h2 id="continue-reading-title" className={classes.sectionTitle}>Tu camino de lectura</h2>
            <p>Retoma una lectura y vuelve al ritmo que habías comenzado.</p>
          </div>

          <div className={classes.readingJourney}>
            {latest ? (
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

            <div className={classes.journeyDivider} aria-hidden="true" />
            <ReadingStreak embedded />
          </div>
        </section>
      </div>
    </div>
  );
}
