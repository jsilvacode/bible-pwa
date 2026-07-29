/**
 * Splits data-source/cba/{bookId}.json into per-chapter public files:
 * public/data/cba/{bookId}/{chapter}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CBA_SOURCE_DIR = path.join(__dirname, '../data-source/cba');
const CBA_OUTPUT_DIR = path.join(__dirname, '../public/data/cba');

const bookFiles = fs.readdirSync(CBA_SOURCE_DIR).filter((f) => /^\d+\.json$/.test(f));

for (const file of bookFiles) {
  const bookId = file.replace('.json', '');
  const bookPath = path.join(CBA_SOURCE_DIR, file);
  const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
  const outDir = path.join(CBA_OUTPUT_DIR, bookId);
  const chapters = Object.entries(bookData).filter(([chapter]) => Number(chapter) >= 1);

  fs.mkdirSync(outDir, { recursive: true });

  for (const [chapter, verses] of chapters) {
    const chapterPath = path.join(outDir, `${chapter}.json`);
    fs.writeFileSync(chapterPath, JSON.stringify(verses));
  }

  console.log(`Split book ${bookId}: ${chapters.length} chapters`);
}

console.log('CBA split complete.');
