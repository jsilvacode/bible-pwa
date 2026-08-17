/**
 * Editorial and structural audit for the three Bible editions shipped by the
 * PWA. It reads the canonical book payloads (not their derived chapter
 * copies), reports source artifacts, and leaves the source text untouched.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeDisplayedText } from '../src/utils/textNormalizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'public/data');
const reportDir = path.join(rootDir, 'reports');
const versions = ['nbla', 'rva2015', 'kjv'];
const sourceArtifactPattern = /[¶\u00AD\u200B-\u200D\uFEFF]|^\s*[-–—]\s*»/u;

function sample(samples, entry) {
  if (samples.length < 12) samples.push(entry);
}

function makeSummary() {
  return {
    books: 0,
    chapters: 0,
    verses: 0,
    headings: 0,
    emptyVerses: 0,
    duplicateVerseNumbers: 0,
    nonSequentialVerses: 0,
    invalidUnicode: 0,
    sourceArtifacts: 0,
    presentationNormalizations: 0,
    samples: {
      structure: [],
      artifacts: [],
      normalization: [],
    },
  };
}

function auditVersion(version) {
  const summary = makeSummary();
  const versionDir = path.join(dataDir, version);
  const books = fs.readdirSync(versionDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  for (const filename of books) {
    const book = JSON.parse(fs.readFileSync(path.join(versionDir, filename), 'utf8'));
    summary.books += 1;

    if (!Array.isArray(book.chapters)) {
      sample(summary.samples.structure, { file: filename, issue: 'chapters_missing' });
      continue;
    }

    for (const chapter of book.chapters) {
      summary.chapters += 1;
      const seen = new Set();
      let previousVerse = 0;

      if (!Array.isArray(chapter.verses)) {
        sample(summary.samples.structure, { file: filename, chapter: chapter.chapter, issue: 'verses_missing' });
        continue;
      }

      for (const verse of chapter.verses) {
        summary.verses += 1;
        const location = `${filename.replace(/\.json$/u, '')} ${chapter.chapter}:${verse.verse}`;
        const verseNumber = Number(verse.verse);
        const text = verse.text;

        if (!Number.isInteger(verseNumber) || verseNumber < 1 || seen.has(verseNumber)) {
          summary.duplicateVerseNumbers += 1;
          sample(summary.samples.structure, { location, issue: 'invalid_or_duplicate_verse_number' });
        }
        seen.add(verseNumber);

        if (verseNumber <= previousVerse) {
          summary.nonSequentialVerses += 1;
          sample(summary.samples.structure, { location, issue: 'non_sequential_verse_number' });
        }
        previousVerse = verseNumber;

        if (typeof text !== 'string' || !text.trim()) {
          summary.emptyVerses += 1;
          sample(summary.samples.structure, { location, issue: 'empty_text' });
          continue;
        }

        if (text.normalize('NFC') !== text) {
          summary.invalidUnicode += 1;
          sample(summary.samples.normalization, { location, issue: 'non_nfc_unicode', text });
        }

        if (sourceArtifactPattern.test(text)) {
          summary.sourceArtifacts += 1;
          sample(summary.samples.artifacts, { location, text });
        }

        if (normalizeDisplayedText(text) !== text) {
          summary.presentationNormalizations += 1;
          sample(summary.samples.normalization, {
            location,
            source: text,
            display: normalizeDisplayedText(text),
          });
        }

        if (typeof verse.heading === 'string' && verse.heading.trim()) {
          summary.headings += 1;
        }
      }
    }
  }

  return summary;
}

const report = {
  generatedAt: new Date().toISOString(),
  source: 'public/data/{nbla,rva2015,kjv}',
  versions: Object.fromEntries(versions.map((version) => [version, auditVersion(version)])),
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, 'bible-integrity.json'),
  `${JSON.stringify(report, null, 2)}\n`
);

for (const [version, summary] of Object.entries(report.versions)) {
  console.log(
    `${version.toUpperCase()}: ${summary.books} libros · ${summary.chapters} capítulos · ${summary.verses} versículos · ` +
      `${summary.presentationNormalizations} ajustes visuales · ${summary.emptyVerses + summary.duplicateVerseNumbers + summary.nonSequentialVerses} errores estructurales`
  );
}

const hasStructuralErrors = Object.values(report.versions).some((summary) => (
  summary.emptyVerses > 0 || summary.duplicateVerseNumbers > 0 || summary.nonSequentialVerses > 0
));

if (hasStructuralErrors) process.exitCode = 1;
