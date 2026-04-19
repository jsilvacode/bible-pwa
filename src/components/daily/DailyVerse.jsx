import { useNavigate } from "react-router-dom";
import React from 'react';
import classes from './DailyVerse.module.css';

const DAILY_VERSES = [
  { 
    ref: "Génesis 1:1", text: "En el principio creó Dios los cielos y la tierra.", book: 1, chapter: 1, verse: 1,
    egwQuote: "Dios es la fuente de toda vida, y sólo en él encontramos el poder creador.",
    egwSource: null
  },
  { 
    ref: "Josué 1:9", text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.", book: 6, chapter: 1, verse: 9,
    egwQuote: "La presencia del Señor es la verdadera garantía de la victoria del creyente en cada batalla.",
    egwSource: null
  },
  { 
    ref: "Salmos 23:1", text: "Jehová es mi pastor; nada me faltará.", book: 19, chapter: 23, verse: 1,
    egwQuote: "El divino Pastor conoce a cada una de sus ovejas y las llama por su nombre.",
    egwSource: null
  },
  { 
    ref: "Proverbios 3:5", text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", book: 20, chapter: 3, verse: 5,
    egwQuote: "Nuestra parte es confiar plenamente en las misericordias inagotables de un Padre amante.",
    egwSource: null
  },
  { 
    ref: "Isaías 41:10", text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.", book: 23, chapter: 41, verse: 10,
    egwQuote: "Nada hay que el Señor desee más que ver a sus hijos descansar en la seguridad de sus promesas.",
    egwSource: null
  },
  { 
    ref: "Juan 3:16", text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", book: 43, chapter: 3, verse: 16,
    egwQuote: "El don supremo de Cristo fue concedido porque Dios anhelaba recuperar para sí la familia humana.",
    egwSource: null
  },
  { 
    ref: "1 Juan 4:8", text: "El que no ama, no ha conocido a Dios; porque Dios es amor.", book: 62, chapter: 4, verse: 8,
    egwQuote: "Todo verdadero amor tiene su origen en Dios, porque Dios es la encarnación misma del amor.",
    egwSource: null
  }
];

export default function DailyVerse({ variant = 'hero' }) {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const idx = seed % DAILY_VERSES.length;
  const verse = DAILY_VERSES[idx];
  const navigate = useNavigate();

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
    <div 
      className={`${classes.container} ${isHero ? classes.hero : classes.compact}`}
      onClick={() => navigate(`/read/${verse.book}/${verse.chapter}`)}
    >
      <div className={classes.content}>
        <div className={classes.header}>
          <span className={classes.tag}>VERSÍCULO DEL DÍA</span>
          <h2 className={classes.reference}>{verse.ref}</h2>
        </div>
        
        <p className={classes.verseText}>"{verse.text}"</p>
        
        {isHero && verse.egwQuote && (
          <div className={classes.egwQuote}>
            <p className={classes.egwContent}>{verse.egwQuote}</p>
            <span className={classes.egwAuthor}>— Elena G. de White</span>
          </div>
        )}

        <div className={classes.actions}>
          <button className={classes.actionBtn} onClick={handleShare}>
            Compartir
          </button>
          <button className={classes.readBtn}>
            Leer capítulo completo
          </button>
        </div>
      </div>
    </div>
  );
}
