import React from 'react';
import classes from './DailyVerse.module.css';

const DAILY_VERSES = [
  { ref: "Génesis 1:1", text: "En el principio creó Dios los cielos y la tierra.", book: 1, chapter: 1, verse: 1 },
  { ref: "Josué 1:9", text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.", book: 6, chapter: 1, verse: 9 },
  { ref: "Salmos 23:1", text: "Jehová es mi pastor; nada me faltará.", book: 19, chapter: 23, verse: 1 },
  { ref: "Proverbios 3:5", text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", book: 20, chapter: 3, verse: 5 },
  { ref: "Isaías 41:10", text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.", book: 23, chapter: 41, verse: 10 },
  { ref: "Juan 3:16", text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", book: 43, chapter: 3, verse: 16 },
  { ref: "Romanos 8:28", text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien...", book: 45, chapter: 8, verse: 28 },
  { ref: "Filipenses 4:13", text: "Todo lo puedo en Cristo que me fortalece.", book: 50, chapter: 4, verse: 13 },
  { ref: "Hebreos 11:1", text: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.", book: 58, chapter: 11, verse: 1 },
  { ref: "1 Juan 4:8", text: "El que no ama, no ha conocido a Dios; porque Dios es amor.", book: 62, chapter: 4, verse: 8 }
];

export default function DailyVerse() {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const idx = seed % DAILY_VERSES.length;
  const verse = DAILY_VERSES[idx];

  return (
    <div className={classes.card}>
      <div className={classes.header}>
        <h3>🌞 Versículo del Día</h3>
      </div>
      <div className={classes.body}>
        <p className={classes.text}>"{verse.text}"</p>
        <div className={classes.ref}>— {verse.ref}</div>
      </div>
    </div>
  );
}
