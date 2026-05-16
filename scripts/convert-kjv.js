import fs from 'fs';
import path from 'path';
import https from 'https';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKS = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/books.json'), 'utf8'));

const KJV_URL = 'https://raw.githubusercontent.com/mrk214/bible-data-en-eng/main/data/en___eng___eng/KJV_vid_1.json';
const outputDir = path.join(__dirname, '../public/data/kjv');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Error HTTP: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function convert() {
  console.log('\n📖 Descargando KJV de GitHub...\n');
  try {
    const raw = await download(KJV_URL);
    fs.mkdirSync(outputDir, { recursive: true });

    const usfmMap = {
      "GEN": 1, "EXO": 2, "LEV": 3, "NUM": 4, "DEU": 5, "JOS": 6, "JDG": 7, "RUT": 8, "1SA": 9, "2SA": 10,
      "1KI": 11, "2KI": 12, "1CH": 13, "2CH": 14, "EZR": 15, "NEH": 16, "EST": 17, "JOB": 18, "PSA": 19, "PRO": 20,
      "ECC": 21, "SNG": 22, "ISA": 23, "JER": 24, "LAM": 25, "EZK": 26, "DAN": 27, "HOS": 28, "JOL": 29, "AMO": 30,
      "OBA": 31, "JON": 32, "MIC": 33, "NAM": 34, "HAB": 35, "ZEP": 36, "HAG": 37, "ZEC": 38, "MAL": 39,
      "MAT": 40, "MRK": 41, "LUK": 42, "JHN": 43, "ACT": 44, "ROM": 45, "1CO": 46, "2CO": 47, "GAL": 48, "EPH": 49,
      "PHP": 50, "COL": 51, "1TH": 52, "2TH": 53, "1TI": 54, "2TI": 55, "TIT": 56, "PHM": 57, "HEB": 58, "JAS": 59,
      "1PE": 60, "2PE": 61, "1JN": 62, "2JN": 63, "3JN": 64, "JUD": 65, "REV": 66
    };

    let count = 0;
    for (const book of raw.books) {
      const bookId = usfmMap[book.book_usfm];
      if (!bookId) continue;

      const meta = BOOKS.find(b => b.id === bookId);
      if (!meta) {
        console.warn(`  ⚠️  No meta for book ID: ${bookId}`);
        continue;
      }

      const output = {
        version: 'kjv',
        book: meta.id,
        name: meta.name,
        chapters: book.chapters.map((ch, i) => {
          const $ = cheerio.load(ch.chapter_html);
          const verses = [];
          
          let pendingHeading = null;
          $('*').each((_, el) => {
            if ($(el).hasClass('heading')) {
              pendingHeading = $(el).text().trim();
            } else if ($(el).hasClass('verse')) {
              const usfmAttr = $(el).attr('data-usfm');
              if (!usfmAttr) return;
              const verseNum = parseInt(usfmAttr.split('.')[2], 10);
              const verseText = $(el).find('.content').text().trim();
              
              if (!isNaN(verseNum) && verseText) {
                const existing = verses.find(v => v.verse === verseNum);
                if (existing) {
                  existing.text += ' ' + verseText;
                } else {
                  const v = { verse: verseNum, text: verseText };
                  if (pendingHeading) {
                    v.heading = pendingHeading;
                    pendingHeading = null;
                  }
                  verses.push(v);
                }
              }
            }
          });
          
          return { chapter: i + 1, verses };
        })
      };

      const filename = `${String(meta.id).padStart(2, '0')}_${meta.slug}.json`;
      fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(output, null, 2)
      );
      console.log(`  ✓ ${filename} — ${book.chapters.length} capítulos`);
      count++;
    }

    console.log(`\n✅ Listo. ${count}/66 libros generados en public/data/kjv/\n`);
  } catch (err) {
    console.error('Error fatal:', err);
  }
}

convert();
