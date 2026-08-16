const BOOK_NAMES = {
  Gen: 'Génesis',
  Exo: 'Éxodo',
  Lev: 'Levítico',
  Num: 'Números',
  Deu: 'Deuteronomio',
  Jos: 'Josué',
  JOS: 'Josué',
  Jdg: 'Jueces',
  Rth: 'Rut',
  Rht: 'Rut',
  Rut: 'Rut',
  '1Sa': '1 Samuel',
  '2Sa': '2 Samuel',
  '1Ki': '1 Reyes',
  '2Ki': '2 Reyes',
  '1Ch': '1 Crónicas',
  '2Ch': '2 Crónicas',
  Ezr: 'Esdras',
  Neh: 'Nehemías',
  Est: 'Ester',
  Job: 'Job',
  Psa: 'Salmos',
  Sal: 'Salmos',
  Pro: 'Proverbios',
  Ecc: 'Eclesiastés',
  Son: 'Cantares',
  Isa: 'Isaías',
  lsa: 'Isaías',
  Jer: 'Jeremías',
  Lam: 'Lamentaciones',
  Eze: 'Ezequiel',
  Dan: 'Daniel',
  Hos: 'Oseas',
  Joe: 'Joel',
  Amo: 'Amós',
  Oba: 'Abdías',
  Jon: 'Jonás',
  Mic: 'Miqueas',
  Miq: 'Miqueas',
  Nah: 'Nahúm',
  Hab: 'Habacuc',
  Zep: 'Sofonías',
  Hag: 'Hageo',
  Zec: 'Zacarías',
  Mal: 'Malaquías',
  Mat: 'Mateo',
  Mar: 'Marcos',
  Luk: 'Lucas',
  Joh: 'Juan',
  Act: 'Hechos',
  Hech: 'Hechos',
  Rom: 'Romanos',
  '1Co': '1 Corintios',
  '1Cor': '1 Corintios',
  '2Co': '2 Corintios',
  Gal: 'Gálatas',
  Eph: 'Efesios',
  Phi: 'Filipenses',
  Php: 'Filipenses',
  Col: 'Colosenses',
  '1Th': '1 Tesalonicenses',
  '1Te': '1 Tesalonicenses',
  '2Th': '2 Tesalonicenses',
  '1Ti': '1 Timoteo',
  '2Ti': '2 Timoteo',
  Tit: 'Tito',
  Phm: 'Filemón',
  Heb: 'Hebreos',
  Jam: 'Santiago',
  Jas: 'Santiago',
  '1Pe': '1 Pedro',
  '2Pe': '2 Pedro',
  '1Jn': '1 Juan',
  '1Jo': '1 Juan',
  '1Joh': '1 Juan',
  '2Jo': '2 Juan',
  '3Jo': '3 Juan',
  '3Jn': '3 Juan',
  Jud: 'Judas',
  Rev: 'Apocalipsis',
  Tob: 'Tobías',
  Jdt: 'Judit',
  '1Ma': '1 Macabeos',
  '2Ma': '2 Macabeos',
  Bar: 'Baruc',
  Sir: 'Eclesiástico',
  Wis: 'Sabiduría',
};

const CP1252 = {
  0x80: '€',
  0x82: '‚',
  0x83: 'ƒ',
  0x84: '„',
  0x85: '…',
  0x86: '†',
  0x87: '‡',
  0x88: 'ˆ',
  0x89: '‰',
  0x8a: 'Š',
  0x8b: '‹',
  0x8c: 'Œ',
  0x8e: 'Ž',
  0x91: '‘',
  0x92: '’',
  0x93: '“',
  0x94: '”',
  0x95: '•',
  0x96: '–',
  0x97: '—',
  0x98: '˜',
  0x99: '™',
  0x9a: 'š',
  0x9b: '›',
  0x9c: 'œ',
  0x9e: 'ž',
  0x9f: 'Ÿ',
};

const RTF_SYMBOLS = {
  emdash: '—',
  endash: '–',
  bullet: '•',
  lquote: '‘',
  rquote: '’',
  ldblquote: '“',
  rdblquote: '”',
};

function decodeRtfCodePoint(value) {
  const codePoint = Number(value);
  return String.fromCodePoint(codePoint < 0 ? codePoint + 65536 : codePoint);
}

function decodeHexCharacter(value) {
  const code = Number.parseInt(value, 16);
  return CP1252[code] ?? String.fromCharCode(code);
}

function createParagraph() {
  return { text: '', firstBoldIndex: null, boldCharacters: 0 };
}

function cleanParagraph(rawParagraph, context) {
  let text = rawParagraph.text.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const firstBoldIndex = rawParagraph.firstBoldIndex;
  if (/^\s*\[/.test(rawParagraph.text) && firstBoldIndex !== null) {
    text = rawParagraph.text.slice(firstBoldIndex).replace(/\s+/g, ' ').trim();
  }

  const hadPageArtifact = /[.!?]\s+\d{3,4}\s*$/u.test(text);

  text = text
    .replace(/^\s*\[(?:[1-3]?[A-Za-z]{2,5})_?\d*:\d+\.?\s*/u, '')
    .replace(/^Comentario B[ií]blico Adventista\s*/iu, '')
    .replace(/([.!?])\s+\d{3,4}\s*$/u, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || /^Comentario B[ií]blico Adventista$/iu.test(text)) return null;

  return {
    text: formatBibleReferences(text, context),
    isBold: rawParagraph.boldCharacters > 0,
    boldRatio: rawParagraph.boldCharacters / Math.max(rawParagraph.text.length, 1),
    hadPageArtifact,
  };
}

function isHeading(paragraph) {
  if (!paragraph.isBold || paragraph.text.length > 180) return false;
  return paragraph.boldRatio >= 0.45 || paragraph.text.length <= 90;
}

/**
 * Converts the Bible reference syntax used by The Word modules to readable Spanish.
 * Incomplete source references deliberately retain only the information that exists.
 */
export function formatBibleReferences(text, context = {}) {
  const normalized = text
    .replace(/(1Sa_1):1(Ch_6:22-28)/gu, '$1:1; 1$2')
    .replace(
      /([1-3]?[A-Za-z]{2,5}_\d+):\d+(?=([1-3]?[A-Za-z]{2,5})_)/gu,
      '$1; $2_',
    );

  return normalized.replace(
    /\b([1-3]?[A-Za-z]{2,5}|YYY|cap)_(\d+)(?::(?:(\d+)(?:-(\d+))?)?)?/gu,
    (match, code, chapter, verse, verseEnd) => {
      if (code === 'cap') {
        return `capítulo ${chapter}${verse ? `:${verse}${verseEnd ? `-${verseEnd}` : ''}` : ''}`;
      }

      const book = code === 'YYY' ? context.bookName : BOOK_NAMES[code];
      if (!book) return match;
      if (!verse) {
        const numericChapter = Number(chapter);
        const ownBookReference = book === context.bookName;
        const exceedsBookLength = numericChapter > (context.chapterCount ?? Infinity);

        if (ownBookReference && exceedsBookLength) {
          const currentChapter = String(context.chapter ?? '');
          const remainingVerse = chapter.startsWith(currentChapter)
            ? chapter.slice(currentChapter.length)
            : chapter;

          if (remainingVerse && Number(remainingVerse) <= 176) {
            return `${book} ${currentChapter}:${remainingVerse}`;
          }
        }
        return `${book} ${chapter}`;
      }
      return `${book} ${chapter}:${verse}${verseEnd ? `-${verseEnd}` : ''}`;
    },
  );
}

/**
 * Parses the limited RTF dialect emitted by the supplied The Word commentary module.
 * It intentionally preserves paragraph boundaries and bold headings instead of flattening
 * everything into a single string.
 */
export function parseCbaRtf(rtf, context = {}) {
  if (typeof rtf !== 'string' || !rtf.includes('\\')) {
    return { blocks: [], warnings: ['invalid-rtf'] };
  }

  const paragraphs = [];
  let paragraph = createParagraph();
  let state = { bold: false };
  const stack = [];

  function append(value) {
    paragraph.text += value;
    if (state.bold) {
      paragraph.boldCharacters += value.length;
      if (paragraph.firstBoldIndex === null) {
        paragraph.firstBoldIndex = paragraph.text.length - value.length;
      }
    }
  }

  function finishParagraph() {
    const cleaned = cleanParagraph(paragraph, context);
    if (cleaned) paragraphs.push(cleaned);
    paragraph = createParagraph();
  }

  for (let index = 0; index < rtf.length; index += 1) {
    const char = rtf[index];

    if (char === '{') {
      stack.push({ ...state });
      continue;
    }

    if (char === '}') {
      state = stack.pop() ?? state;
      continue;
    }

    if (char !== '\\') {
      append(char);
      continue;
    }

    const next = rtf[index + 1];
    if (!next) break;

    if (next === '\\' || next === '{' || next === '}') {
      append(next);
      index += 1;
      continue;
    }

    if (next === "'") {
      const hex = rtf.slice(index + 2, index + 4);
      if (/^[0-9a-f]{2}$/iu.test(hex)) {
        append(decodeHexCharacter(hex));
        index += 3;
      }
      continue;
    }

    const wordMatch = rtf.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/iu);
    if (!wordMatch) continue;

    const [control, word, numericValue] = wordMatch;
    index += control.length;

    if (word === 'u' && numericValue) {
      append(decodeRtfCodePoint(numericValue));
      if (rtf[index + 1] === '?') index += 1;
      continue;
    }

    if (word === 'par' || word === 'line') {
      finishParagraph();
      continue;
    }

    if (word === 'tab') {
      append(' ');
      continue;
    }

    if (RTF_SYMBOLS[word]) {
      append(RTF_SYMBOLS[word]);
      continue;
    }

    if (word === 'b') {
      state.bold = numericValue !== '0';
    }
  }

  finishParagraph();

  const blocks = paragraphs.map((paragraph) => ({
    type: isHeading(paragraph) ? 'heading' : 'paragraph',
    text: paragraph.text,
  }));

  const warnings = [];
  if (paragraphs.some((paragraph) => paragraph.hadPageArtifact)) {
    warnings.push('removed-page-artifact');
  }
  if (blocks.some((block) => /\\(?:u|par|[a-z]{2,})/iu.test(block.text))) {
    warnings.push('unparsed-rtf-control');
  }
  if (blocks.some((block) => block.text.includes('�'))) {
    warnings.push('replacement-character');
  }

  return { blocks, warnings };
}

export function legacyTextToBlocks(text) {
  if (typeof text !== 'string') return [];
  return text
    .replace(/\r/g, '')
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((paragraph) => ({ type: 'paragraph', text: formatBibleReferences(paragraph) }));
}
