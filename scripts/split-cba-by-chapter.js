/**
 * Splits public/data/cba/{bookId}.json into per-chapter files:
 * public/data/cba/{bookId}/{chapter}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CBA_DIR = path.join(__dirname, '../public/data/cba');

const bookFiles = fs.readdirSync(CBA_DIR).filter((f) => /^\d+\.json$/.test(f));

for (const file of bookFiles) {
  const bookId = file.replace('.json', '');
  const bookPath = path.join(CBA_DIR, file);
  const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
  const outDir = path.join(CBA_DIR, bookId);

  fs.mkdirSync(outDir, { recursive: true });

  for (const [chapter, verses] of Object.entries(bookData)) {
    const chapterPath = path.join(outDir, `${chapter}.json`);
    fs.writeFileSync(chapterPath, JSON.stringify(verses));
  }

  console.log(`Split book ${bookId}: ${Object.keys(bookData).length} chapters`);
}

console.log('CBA split complete.');
