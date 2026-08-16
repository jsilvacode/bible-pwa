import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { removeLikelyInlinePageArtifacts } from './lib/cbaPageArtifacts.js';
import { parseCbaRtf } from './lib/cbaRtf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../data-source/cba');
const DEFAULT_REPORT_PATH = path.join(__dirname, '../reports/cba-integrity.json');
const BOOKS_MANIFEST_PATH = path.join(__dirname, '../public/data/books.json');

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function requiredInputPath() {
  const input = readOption('--input') ?? process.env.CBA_TWM_PATH;
  if (!input) {
    throw new Error('Indica la base fuente con --input <ruta> o CBA_TWM_PATH.');
  }
  if (!fs.existsSync(input)) {
    throw new Error(`No existe la base fuente: ${input}`);
  }
  return path.resolve(input);
}

function reviewKey(book, chapter, verse) {
  return `${book}/${chapter}:${verse}`;
}

function addEntry(bookData, chapter, verse, entry) {
  bookData[chapter] ??= {};
  const existing = bookData[chapter][verse];
  if (!existing) {
    bookData[chapter][verse] = entry;
    return;
  }

  bookData[chapter][verse] = {
    blocks: [...existing.blocks, ...entry.blocks],
    review: existing.review ?? entry.review,
  };
}

function sortNumerically(value) {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([key, child]) => [
        key,
        child && typeof child === 'object' && !Array.isArray(child) && !('blocks' in child)
          ? sortNumerically(child)
          : child,
      ]),
  );
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadBooksById() {
  const books = JSON.parse(fs.readFileSync(BOOKS_MANIFEST_PATH, 'utf8'));
  return new Map(books.map((book) => [String(book.id), book]));
}

function validateEntry(entry) {
  return entry.blocks.every((block) => (
    typeof block.text === 'string'
    && block.text.length > 0
    && !/\\(?:u-?\d+|par|pard|cf\d+|fs\d+)/iu.test(block.text)
    && !/[�]/u.test(block.text)
  ));
}

async function readRows(inputPath) {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(inputPath, sqlite3.OPEN_READONLY, (openError) => {
      if (openError) reject(openError);
    });

    database.all(
      `SELECT b.bi, b.ci, b.fvi, b.tvi, b.content_type, c.data
       FROM bible_refs b
       JOIN content c ON c.topic_id = b.topic_id
       WHERE b.ci >= 1
       ORDER BY b.bi, b.ci, b.fvi, b.topic_id`,
      (queryError, rows) => {
        database.close();
        if (queryError) reject(queryError);
        else resolve(rows);
      },
    );
  });
}

async function main() {
  const inputPath = requiredInputPath();
  const outputDir = path.resolve(readOption('--output') ?? DEFAULT_OUTPUT_DIR);
  const reportPath = path.resolve(readOption('--report') ?? DEFAULT_REPORT_PATH);
  const booksById = loadBooksById();
  const rows = await readRows(inputPath);
  const books = {};
  const reviewEntries = [];
  const warnings = { pageArtifactsRemoved: 0, inlinePageArtifactsRemoved: 0, parseWarnings: 0, unavailableEntries: 0 };

  for (const row of rows) {
    const book = String(row.bi);
    const chapter = String(row.ci);
    books[book] ??= {};

    const bookMeta = booksById.get(book);
    if (!bookMeta) throw new Error(`No hay metadatos para el libro CBA ${book}.`);

    const parsed = parseCbaRtf(row.data, {
      bookName: bookMeta.name,
      chapter: Number(chapter),
      chapterCount: Number(bookMeta.chapters),
    });
    const parserWarnings = parsed.warnings.filter((warning) => warning !== 'removed-page-artifact');
    warnings.pageArtifactsRemoved += parsed.warnings.filter(
      (warning) => warning === 'removed-page-artifact',
    ).length;
    warnings.parseWarnings += parserWarnings.length;

    for (let verseNumber = row.fvi; verseNumber <= row.tvi; verseNumber += 1) {
      const verse = String(verseNumber);
      let entry;

      if (parsed.blocks.length > 0 && parserWarnings.length === 0) {
        entry = { blocks: parsed.blocks };
      } else {
        entry = { blocks: [], review: 'source-unavailable' };
        warnings.unavailableEntries += 1;
        reviewEntries.push({
          at: reviewKey(book, chapter, verse),
          reason: row.content_type === 'rvf' ? 'rvf-source' : parserWarnings.join(', '),
          action: 'source-unavailable',
        });
      }

      if (!validateEntry(entry)) {
        throw new Error(`La entrada ${reviewKey(book, chapter, verse)} no superó la validación de salida.`);
      }
      addEntry(books[book], chapter, verse, entry);
    }
  }

  const importedEntries = Object.values(books).flatMap((chapters) => (
    Object.values(chapters).flatMap((verses) => Object.values(verses))
  ));
  warnings.inlinePageArtifactsRemoved = removeLikelyInlinePageArtifacts(importedEntries);

  const normalizedBooks = sortNumerically(books);
  const generatedEntries = Object.values(normalizedBooks).reduce(
    (total, chapters) => total + Object.values(chapters).reduce(
      (chapterTotal, verses) => chapterTotal + Object.keys(verses).length,
      0,
    ),
    0,
  );

  for (const [book, data] of Object.entries(normalizedBooks)) {
    writeJson(path.join(outputDir, `${book}.json`), data);
  }

  writeJson(reportPath, {
    source: {
      file: path.basename(inputPath),
      format: 'SQLite/The Word RTF',
      language: 'spa',
    },
    coverage: {
      books: Object.keys(normalizedBooks).length,
      sourceRecords: rows.length,
      generatedEntries,
    },
    warnings,
    reviewEntries,
  });

  console.log(`CBA importado: ${generatedEntries} entradas de ${rows.length} referencias.`);
  console.log(`Revisión requerida: ${reviewEntries.length}. Reporte: ${reportPath}`);
}

main().catch((error) => {
  console.error(`No se pudo importar el CBA: ${error.message}`);
  process.exitCode = 1;
});
