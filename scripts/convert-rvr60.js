const fs = require('fs');
const path = require('path');

const BOOKS = require('../src/data/books-meta.js');
const inputFile = path.join(require('os').homedir(), 'Downloads/es_rvr.json');
const outputDir = path.join(__dirname, '../public/data/rvr60');

console.log('\n📖 Convirtiendo RVR60...\n');

const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
fs.mkdirSync(outputDir, { recursive: true });

const byAbbrev = {};
for (const book of raw) {
  byAbbrev[book.abbrev] = book.chapters;
}

let count = 0;
for (const book of BOOKS) {
  const chapters = byAbbrev[book.abbrev];
  if (!chapters) {
    console.warn(`  ⚠️  Sin datos: ${book.abbrev} (${book.name})`);
    continue;
  }

  const output = {
    version: 'rvr60',
    book: book.id,
    name: book.name,
    chapters: chapters.map((verses, i) => ({
      chapter: i + 1,
      verses: verses.map((text, j) => ({
        verse: j + 1,
        text
      }))
    }))
  };

  const filename = `${String(book.id).padStart(2, '0')}_${book.slug}.json`;
  fs.writeFileSync(
    path.join(outputDir, filename),
    JSON.stringify(output, null, 2)
  );
  console.log(`  ✓ ${filename} — ${chapters.length} capítulos`);
  count++;
}

console.log(`\n✅ Listo. ${count}/66 libros en public/data/rvr60/\n`);
