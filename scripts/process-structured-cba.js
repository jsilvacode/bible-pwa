import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = path.join(__dirname, '../data-raw/Comentario_Biblico_Adventista_Estructurado.json');
const OUTPUT_DIR = path.join(__dirname, '../public/data/cba');

const booksManifestPath = path.join(__dirname, '../public/data/books.json');
const booksManifest = JSON.parse(fs.readFileSync(booksManifestPath, 'utf-8'));

const bookMapping = {};
booksManifest.forEach(b => {
  bookMapping[b.name] = b.id;
});

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function cleanRTF(rtf) {
  if (!rtf) return "";
  
  let cleaned = rtf;

  // 1. Remove "The Word" custom links first
  cleaned = cleaned.replace(/"tw:\/\/bible.*?"/g, ' ');
  
  // 2. Remove numeric markers like ) 0 1 -1 9 0, ( 0 1 ..., ! 0 2 ...
  cleaned = cleaned.replace(/[()!]\s*([0-9-]+\s*){2,}/g, ' ');

  // 3. Preserve paragraph breaks before removing other RTF tags
  // We use a negative lookahead to avoid matching \pard
  cleaned = cleaned.replace(/\\par(?![a-z])/gi, '\n');

  // 4. Handle Unicode escapes \u123?
  cleaned = cleaned.replace(/\\u(\d+)\??/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec));
    } catch (e) {
      return "";
    }
  });

  // 5. Remove remaining RTF tags (like \pard, \cf6, \b, etc)
  cleaned = cleaned.replace(/\\[a-z0-9-]+[ ]?/gi, ' ');
  
  // 6. Remove stylesheet garbage (StyleName, FontName, Colorcl, etc.)
  cleaned = cleaned.replace(/[A-Za-z]+(Name|Style|Font|Color|Hover|Jump|Unicode|Indent|Space|After|Tabs|First|Default|Standard|Effect|rvhe|Heading|Module)[A-Za-z0-9]*/g, ' ');
  cleaned = cleaned.replace(/\b(Unicode|NextStyleNo|Module|Heading|Font|Standard|Default|StyleName|FontName|Colorcl|Stylefs)\b/g, ' ');
  cleaned = cleaned.replace(/-[0-9]\s([0-9]\s?)+/g, ' '); // Matches -9 2 0 0 2 0 1
  cleaned = cleaned.replace(/-8\s1\s3/g, ' ');

  // 7. Remove braces
  cleaned = cleaned.replace(/[{}]/g, ' ');
  
  // 8. Remove verse markers like [Gen 1:1], [Gen_1:1], [Exo 1:11], [Pro_3:5]
  // Note: Some markers in this source are missing the closing bracket
  cleaned = cleaned.replace(/\[\s*[A-Z0-9][A-Za-z0-9\s_]*[\s:_]\d+:\d+\s*\]?/gi, ' ');
  // Catch-all for any remaining bracketed metadata
  cleaned = cleaned.replace(/[\[\]]/g, ' '); 

  // 9. Remove "Comentario Bíblico Adventista" titles
  cleaned = cleaned.replace(/Comentario B[i\?í]?blico Adventista/gi, ' ');
  cleaned = cleaned.replace(/Comentario B[i\?í]?blico/gi, ' ');

  // 10. Clean up numeric leftovers and other artifacts
  cleaned = cleaned.replace(/\)\s*[0-9-]+\s*/g, ' ');
  cleaned = cleaned.replace(/[0-9-]{4,}\s*/g, ' '); // Long numbers like -813-9200201
  cleaned = cleaned.replace(/\s[0-9]\s[0-9]\s[0-9]\s/g, ' '); // Single digits like 0 1 1

  // 11. Final whitespace cleanup while preserving paragraph breaks
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Collapse horizontal spaces
  cleaned = cleaned.replace(/\n\s*\n/g, '[[P]]'); // Mark paragraphs
  cleaned = cleaned.replace(/\n/g, ' '); // Collapse single newlines
  cleaned = cleaned.replace(/\[\[P\]\]/g, '\n\n'); // Restore paragraphs
  cleaned = cleaned.trim();
  
  return cleaned;
}

console.log("Reading giant JSON file...");
const rawData = fs.readFileSync(INPUT_PATH, 'utf-8');
const data = JSON.parse(rawData);

const books = {};

console.log("Processing records...");
data.forEach((record, index) => {
  const bookId = bookMapping[record.libro];
  if (!bookId) {
    if (index % 1000 === 0) console.warn(`Libro no reconocido: ${record.libro}`);
    return;
  }

  if (!books[bookId]) books[bookId] = {};
  const chapter = record.capitulo;
  if (!books[bookId][chapter]) books[bookId][chapter] = {};

  const cleanedContent = cleanRTF(record.contenido);
  
  // Handle verse ranges
  const from = record.versiculo_desde || 0;
  const to = record.versiculo_hasta || from;

  for (let v = from; v <= to; v++) {
    // If it's verse 0, it's usually an intro to the chapter or book
    const verseKey = String(v);
    if (books[bookId][chapter][verseKey]) {
      books[bookId][chapter][verseKey] += "\n\n" + cleanedContent;
    } else {
      books[bookId][chapter][verseKey] = cleanedContent;
    }
  }
});

console.log("Saving book files...");
Object.keys(books).forEach(bookId => {
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${bookId}.json`),
    JSON.stringify(books[bookId], null, 2)
  );
});

console.log("Done! CBA processed and optimized.");
