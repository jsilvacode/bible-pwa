import React, { useEffect, useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import SearchModal from './SearchModal';
import { useRecentReads, useSettings } from '../../hooks/useSettings';
import { useBookNames } from '../../hooks/useBookNames';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconUser, IconPlay } from '../ui/Icons';
import classes from './HomeScreen.module.css';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const { settings } = useSettings();
  const { bookNames } = useBookNames();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  const lastRead = settings.lastRead;
  const lastReadLabel = lastRead?.book
    ? `${bookNames[lastRead.book] || `Libro ${lastRead.book}`} ${lastRead.chapter}`
    : null;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

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
            <button
              type="button"
              className={classes.searchTrigger}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
            >
              <IconSearch size={20} />
            </button>
          </div>
        </header>

        {lastReadLabel && (
          <button
            type="button"
            className={classes.continueBtn}
            onClick={() => navigate(`/read/${lastRead.book}/${lastRead.chapter}`)}
          >
            <IconPlay size={18} className={classes.continueIcon} />
            <span className={classes.continueText}>
              Continuar leyendo
              <strong>{lastReadLabel}</strong>
            </span>
          </button>
        )}

        <DailyVerse variant="hero" />
      </div>

      <div className={classes.bottomSheet}>
        <section className={`${classes.section} ${classes.firstSection}`}>
          <h3 className={classes.sectionTitle}>Navegar la Biblia</h3>
          <CategoryGrid />
        </section>

        {recent.length > 0 && (
          <section className={classes.section}>
            <h3 className={classes.sectionTitle}>Lecturas Recientes</h3>
            <div className={classes.recentScroll}>
              {recent.map((r) => (
                <button
                  key={`${r.book}-${r.chapter}`}
                  type="button"
                  className={classes.recentChip}
                  onClick={() => navigate(`/read/${r.book}/${r.chapter}`)}
                >
                  <span className={classes.recentRef}>
                    {bookNames[r.book]?.slice(0, 3)}. {r.chapter}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <ReadingStreak />
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
