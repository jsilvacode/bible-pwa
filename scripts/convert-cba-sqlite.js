import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../Comentario Biblico Adventista vol. 1-7.cmt.twm');
const OUTPUT_DIR = path.join(__dirname, '../public/data/cba');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

function cleanRTF(rtf) {
  if (!rtf) return "";
  
  // Replace unicode escapes \u123?
  let cleaned = rtf.replace(/\\u(\d+)\??/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec));
  });

  // Remove RTF tags
  cleaned = cleaned.replace(/\\(?!u)[a-z0-9-]+[ ]?/gi, '');
  
  // Remove braces
  cleaned = cleaned.replace(/[{}]/g, '');
  
  // Clean up whitespace and newlines
  cleaned = cleaned.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Remove reference markers like [Gen_5:22
  cleaned = cleaned.replace(/\[[A-Z][a-z0-9_]+:\d+\s*/g, '');

  return cleaned;
}

db.all(`
  SELECT b.bi, b.ci, b.fvi, b.tvi, c.data 
  FROM bible_refs b 
  JOIN content c ON b.topic_id = c.topic_id
  ORDER BY b.bi, b.ci, b.fvi
`, (err, rows) => {
  if (err) {
    console.error("Error query database", err);
    return;
  }

  const books = {};

  rows.forEach(row => {
    const { bi, ci, fvi, tvi, data } = row;
    if (!books[bi]) books[bi] = {};
    if (!books[bi][ci]) books[bi][ci] = {};
    
    const text = cleanRTF(data);
    
    // Assign to range
    for (let v = fvi; v <= tvi; v++) {
      // If verse was already assigned, we might want to append?
      // Usually fvi=tvi, but ranges exist.
      if (books[bi][ci][v]) {
        books[bi][ci][v] += " " + text;
      } else {
        books[bi][ci][v] = text;
      }
    }
  });

  // Save files
  Object.keys(books).forEach(bookId => {
    const bookData = books[bookId];
    // Fill gaps for missing verses by using the previous one?
    // Actually, the Word modules usually have ranges that cover the gaps.
    // Let's just save.
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${bookId}.json`),
      JSON.stringify(bookData, null, 2)
    );
  });

  console.log("Extraction from .twm finished! 66 books processed.");
  db.close();
});
