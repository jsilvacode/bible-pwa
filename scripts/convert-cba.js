import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import he from 'he';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../public/data/cba');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Mapping from our book IDs/slugs to schoolsabatica.cl codes
const bookMapping = [
  {id: 1, code: "gen"}, {id: 2, code: "exo"}, {id: 3, code: "lev"}, {id: 4, code: "num"}, {id: 5, code: "deu"},
  {id: 6, code: "jos"}, {id: 7, code: "jue"}, {id: 8, code: "rut"}, {id: 9, code: "1sam"}, {id: 10, code: "2sam"},
  {id: 11, code: "1rey"}, {id: 12, code: "2rey"}, {id: 13, code: "1cro"}, {id: 14, code: "2cro"}, {id: 15, code: "esd"},
  {id: 16, code: "neh"}, {id: 17, code: "est"}, {id: 18, code: "job"}, {id: 19, code: "sal"}, {id: 20, code: "pro"},
  {id: 21, code: "ecl"}, {id: 22, code: "can"}, {id: 23, code: "isa"}, {id: 24, code: "jer"}, {id: 25, code: "lam"},
  {id: 26, code: "eze"}, {id: 27, code: "dan"}, {id: 28, code: "ose"}, {id: 29, code: "joe"}, {id: 30, code: "amo"},
  {id: 31, code: "abd"}, {id: 32, code: "jon"}, {id: 33, code: "miq"}, {id: 34, code: "nah"}, {id: 35, code: "hab"},
  {id: 36, code: "sof"}, {id: 37, code: "hag"}, {id: 38, code: "zac"}, {id: 39, code: "mal"}, {id: 40, code: "mat"},
  {id: 41, code: "mar"}, {id: 42, code: "luc"}, {id: 43, code: "jua"}, {id: 44, code: "hec"}, {id: 45, code: "rom"},
  {id: 46, code: "1cor"}, {id: 47, code: "2cor"}, {id: 48, code: "gal"}, {id: 49, code: "efe"}, {id: 50, code: "fil"},
  {id: 51, code: "col"}, {id: 52, code: "1tes"}, {id: 53, code: "2tes"}, {id: 54, code: "1tim"}, {id: 55, code: "2tim"},
  {id: 56, code: "tit"}, {id: 57, code: "file"}, {id: 58, code: "heb"}, {id: 59, code: "san"}, {id: 60, code: "1ped"},
  {id: 61, code: "2ped"}, {id: 62, code: "1jua"}, {id: 63, code: "2jua"}, {id: 64, code: "3jua"}, {id: 65, code: "jud"},
  {id: 66, code: "apo"}
];

async function downloadHtml(code) {
  const url = `https://escuelasabatica.cl/biblia/${code}/${code}.htm`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        // Retry with variations if needed
        if (code === "2rey") {
           // special case for 2rey which we know is tricky
           // try something else if we figure it out
        }
        resolve(null);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCba(html) {
  const regex = /<a\s+[^>]*name=["']c(\d+)_(\d+)["'][^>]*>.*?<\/a>/gi;
  const chapters = {};
  
  let match;
  let lastChapter = null;
  let lastVerse = null;
  let lastIndex = 0;

  while ((match = regex.exec(html)) !== null) {
    if (lastChapter !== null && lastVerse !== null) {
      let text = html.substring(lastIndex, match.index);
      text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      text = he.decode(text);
      
      if (!chapters[lastChapter]) chapters[lastChapter] = {};
      chapters[lastChapter][lastVerse] = text;
    }
    
    lastChapter = parseInt(match[1]);
    lastVerse = parseInt(match[2]);
    lastIndex = regex.lastIndex;
  }

  // Last verse
  if (lastChapter !== null && lastVerse !== null) {
    let text = html.substring(lastIndex);
    text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    text = he.decode(text);
    if (!chapters[lastChapter]) chapters[lastChapter] = {};
    chapters[lastChapter][lastVerse] = text;
  }

  return chapters;
}

async function run() {
  console.log("Starting CBA extraction...");
  for (const book of bookMapping) {
    process.stdout.write(`Processing ${book.code}... `);
    try {
      const html = await downloadHtml(book.code);
      if (!html) {
        console.log("FAILED (404)");
        continue;
      }
      const data = parseCba(html);
      const filename = `${book.id}.json`;
      fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
      console.log("OK");
    } catch (err) {
      console.log("ERROR: " + err.message);
    }
  }
  console.log("CBA extraction finished!");
}

run();
