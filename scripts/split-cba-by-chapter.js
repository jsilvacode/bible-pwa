/**
 * Splits data-source/cba/{bookId}.json into per-chapter public files:
 * public/data/cba/{bookId}/{chapter}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);
const CBA_SOURCE_DIR = path.join(__dirname, '../data-source/cba');
const CBA_OUTPUT_DIR = path.join(__dirname, '../public/data/cba');

/**
 * Keeps the source JSON explicit for editorial auditing, while making the
 * chapter payloads sent to readers smaller. "h" and "p" map to heading and
 * paragraph respectively; the browser normalizes them before rendering.
 */
export function packCbaChapter(verses) {
  return Object.fromEntries(Object.entries(verses).map(([verse, entry]) => {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.blocks)) {
      return [verse, entry];
    }

    return [verse, {
      b: entry.blocks.map((block) => [block.type === 'heading' ? 'h' : 'p', block.text]),
      ...(entry.review ? { r: entry.review } : {}),
    }];
  }));
}

export function splitCbaByChapter(sourceDir = CBA_SOURCE_DIR, outputDir = CBA_OUTPUT_DIR) {
  const bookFiles = fs.readdirSync(sourceDir).filter((file) => /^\d+\.json$/u.test(file));

  for (const file of bookFiles) {
    const bookId = file.replace('.json', '');
    const bookPath = path.join(sourceDir, file);
    const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
    const outDir = path.join(outputDir, bookId);
    const chapters = Object.entries(bookData).filter(([chapter]) => Number(chapter) >= 1);

    fs.mkdirSync(outDir, { recursive: true });

    for (const [chapter, verses] of chapters) {
      const chapterPath = path.join(outDir, `${chapter}.json`);
      fs.writeFileSync(chapterPath, JSON.stringify(packCbaChapter(verses)));
    }

    console.log(`Split book ${bookId}: ${chapters.length} chapters`);
  }

  console.log('CBA split complete.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  splitCbaByChapter();
}
