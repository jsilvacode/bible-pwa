import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DAILY_THEME_VERSES } from '../src/data/dailyThemes.js';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(scriptDir, '..');
const publicDir = join(rootDir, 'public', 'data');
const books = JSON.parse(await readFile(join(publicDir, 'books.json'), 'utf8'));
const versions = JSON.parse(await readFile(join(publicDir, 'versions.json'), 'utf8'))
  .filter((version) => version.available);
const failures = [];

if (DAILY_THEME_VERSES.length !== 90) {
  failures.push(`La guía debe contener 90 cápsulas, pero contiene ${DAILY_THEME_VERSES.length}.`);
}

if (new Set(DAILY_THEME_VERSES.map((theme) => theme.id)).size !== DAILY_THEME_VERSES.length) {
  failures.push('La guía contiene identificadores duplicados.');
}

for (const theme of DAILY_THEME_VERSES) {
  const book = books.find((candidate) => candidate.id === theme.book);
  if (!book) {
    failures.push(`${theme.id}: libro ${theme.book} inexistente.`);
    continue;
  }

  for (const version of versions) {
    const chapterPath = join(publicDir, version.id, book.file, `${theme.chapter}.json`);
    try {
      const payload = JSON.parse(await readFile(chapterPath, 'utf8'));
      const verses = Array.isArray(payload) ? payload : payload?.verses;
      if (!Array.isArray(verses) || !verses.some((item) => Number(item.verse) === theme.verse)) {
        failures.push(`${theme.id}: ${version.id} no contiene ${book.name} ${theme.chapter}:${theme.verse}.`);
      }
    } catch {
      failures.push(`${theme.id}: no se pudo leer ${version.id}/${book.file}/${theme.chapter}.json.`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Pan de vida validado: ${DAILY_THEME_VERSES.length} cápsulas en ${versions.length} versiones bíblicas.`);
}
