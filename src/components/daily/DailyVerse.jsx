import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import classes from './DailyVerse.module.css';


const DAILY_VERSES = [
  { 
    ref: "Génesis 1:1", text: "En el principio creó Dios los cielos y la tierra.", book: 1, chapter: 1, verse: 1,
  },
  { 
    ref: "Josué 1:9", text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.", book: 6, chapter: 1, verse: 9,
  },
  { 
    ref: "Salmos 23:1", text: "Jehová es mi pastor; nada me faltará.", book: 19, chapter: 23, verse: 1,
  },
  { 
    ref: "Proverbios 3:5", text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", book: 20, chapter: 3, verse: 5,
  },
  { 
    ref: "Isaías 41:10", text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.", book: 23, chapter: 41, verse: 10,
  },
  { 
    ref: "Juan 3:16", text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", book: 43, chapter: 3, verse: 16,
  },
  { 
    ref: "1 Juan 4:8", text: "El que no ama, no ha conocido a Dios; porque Dios es amor.", book: 62, chapter: 4, verse: 8,
  }
];

export default function DailyVerse({ variant = 'hero' }) {
  const [cbaQuote, setCbaQuote] = useState("");

  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const idx = seed % DAILY_VERSES.length;
  const verse = DAILY_VERSES[idx];
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCba() {
      try {
        const response = await fetch(`/data/cba/${verse.book}.json`);
        if (!response.ok) return;
        const data = await response.json();
        const quote = data[String(verse.chapter)]?.[String(verse.verse)];
        if (quote) setCbaQuote(quote);
      } catch (err) {
        console.error("Error loading CBA", err);
      }
    }
    loadCba();
  }, [verse]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const reference = verse.ref;
    const text = `"${verse.text}" — ${reference}`;
    const url = `${window.location.origin}/read/${verse.book}/${verse.chapter}/${verse.verse}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Versículo del Día', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert('Copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={`${classes.container} ${isHero ? classes.hero : classes.compact}`}>
      <div className={classes.content}>
        <div className={classes.clickableArea} onClick={() => navigate(`/read/${verse.book}/${verse.chapter}/${verse.verse}`)}>
          <div className={classes.header}>
            <span className={classes.tag}>VERSÍCULO DEL DÍA</span>
            <h2 className={classes.reference}>{verse.ref}</h2>
          </div>
          
          <p className={classes.verseText}>"{verse.text}"</p>
        </div>
        
        {isHero && cbaQuote && (
          <div className={classes.cbaQuote}>
            <p className={classes.cbaLabel}>COMENTARIO BÍBLICO ADVENTISTA:</p>
            <p className={classes.cbaContent}>
              {cbaQuote.split('\n\n')[0].length > 350 
                ? cbaQuote.split('\n\n')[0].substring(0, 350) + '...' 
                : cbaQuote.split('\n\n')[0]}
            </p>
            <span 
              className={classes.readMore} 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/read/${verse.book}/${verse.chapter}/${verse.verse}?showCba=true`);
              }}
              style={{ cursor: 'pointer' }}
            >
              Leer más
            </span>
          </div>
        )}

        <div className={classes.actions}>
          <button className={classes.actionBtn} onClick={handleShare}>
            Compartir
          </button>
          <button className={classes.readBtn} onClick={() => navigate(`/read/${verse.book}/${verse.chapter}`)}>
            Leer capítulo completo
          </button>
        </div>
      </div>
    </div>
  );
}


