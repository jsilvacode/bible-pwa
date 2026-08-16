/**
 * Creates chapter-level Bible payloads from the existing book payloads:
 * public/data/{version}/{book-file}/{chapter}.json
 *
 * The original book files remain available for the search worker and for
 * backwards compatibility. The reader uses the smaller chapter files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../public/data');
const versions = ['rva2015', 'nbla', 'kjv'];

let totalChapters = 0;

for (const version of versions) {
  const versionDir = path.join(dataDir, version);
  const bookFiles = fs.readdirSync(versionDir).filter((file) => file.endsWith('.json'));

  for (const bookFile of bookFiles) {
    const bookPath = path.join(versionDir, bookFile);
    const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
    const bookKey = bookFile.replace(/\.json$/, '');
    const bookDir = path.join(versionDir, bookKey);

    fs.mkdirSync(bookDir, { recursive: true });

    for (const chapter of bookData.chapters ?? []) {
      const chapterNumber = Number(chapter.chapter);
      if (!Number.isInteger(chapterNumber) || chapterNumber < 1) continue;

      fs.writeFileSync(
        path.join(bookDir, `${chapterNumber}.json`),
        JSON.stringify(chapter.verses ?? [])
      );
      totalChapters += 1;
    }

    console.log(`✓ ${version}/${bookKey}: ${bookData.chapters?.length ?? 0} capítulos`);
  }
}

console.log(`\n✅ Generados ${totalChapters} archivos de capítulo.`);
