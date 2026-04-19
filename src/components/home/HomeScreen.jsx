import React, { useEffect, useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import CategoryGrid from './CategoryGrid';
import ReadingStreak from './ReadingStreak';
import SearchModal from './SearchModal';
import { useRecentReads } from '../../hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import classes from './HomeScreen.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const navigate = useNavigate();
  const [bookNames, setBookNames] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchBooksManifest()
      .then((books) => {
        const namesMap = {};
        books.forEach((b) => { namesMap[b.id] = b.name; });
        setBookNames(namesMap);
      })
      .catch(console.error);

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
              <div className={classes.avatar}>👤</div>
              <div className={classes.greetingWrap}>
                <span className={classes.date}>{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <h1 className={classes.greeting}>{greeting}</h1>
              </div>
            </div>
            <button className={classes.searchTrigger} onClick={() => setIsSearchOpen(true)} aria-label="Buscar">
              🔍
            </button>
          </div>
        </header>

        <DailyVerse variant="hero" />
      </div>

      <div className={classes.bottomSheet}>
        <section className={classes.section} style={{ marginTop: 0 }}>
          <h3 className={classes.sectionTitle}>Navegar la Biblia</h3>
          <CategoryGrid />
        </section>

        {recent.length > 0 && (
          <section className={classes.section}>
            <h3 className={classes.sectionTitle}>Lecturas Recientes</h3>
            <div className={classes.recentScroll}>
              {recent.map((r, i) => (
                <button 
                  key={i} 
                  className={classes.recentChip}
                  onClick={() => navigate(`/read/${r.book}/${r.chapter}`)}
                >
                  <span className={classes.recentRef}>{bookNames[r.book]?.slice(0, 3)}. {r.chapter}</span>
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
