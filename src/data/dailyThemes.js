const DAILY_THEME_HISTORY_KEY = 'bible_daily_theme_history';
const NO_REPEAT_DAYS = 30;

export const DAILY_THEME_VERSES = [
  { id: 'salmos-23-4', prompt: '¿Sientes temor?', book: 19, chapter: 23, verse: 4 },
  { id: 'salmos-34-18', prompt: '¿Tu corazón está quebrantado?', book: 19, chapter: 34, verse: 18 },
  { id: 'mateo-5-4', prompt: '¿Hay lágrimas hoy?', book: 40, chapter: 5, verse: 4 },
  { id: '2-corintios-1-3', prompt: '¿Necesitas consuelo?', book: 47, chapter: 1, verse: 3 },
  { id: '2-corintios-1-4', prompt: '¿Quieres acompañar a alguien?', book: 47, chapter: 1, verse: 4 },
  { id: 'apocalipsis-21-4', prompt: '¿El dolor pesa en tu camino?', book: 66, chapter: 21, verse: 4 },
  { id: 'juan-11-25', prompt: '¿Anhelas vida nueva?', book: 43, chapter: 11, verse: 25 },
  { id: 'juan-11-26', prompt: '¿Te cuesta mirar hacia adelante?', book: 43, chapter: 11, verse: 26 },
  { id: 'juan-14-1', prompt: '¿Tu corazón necesita descanso?', book: 43, chapter: 14, verse: 1 },
  { id: 'juan-14-2', prompt: '¿Necesitas volver a confiar?', book: 43, chapter: 14, verse: 2 },
  { id: 'juan-14-3', prompt: '¿Esperas un hogar eterno?', book: 43, chapter: 14, verse: 3 },
  { id: 'filipenses-4-7', prompt: '¿Necesitas paz?', book: 50, chapter: 4, verse: 7 },
  { id: '1-tesalonicenses-4-13', prompt: '¿Te inquieta la pérdida?', book: 52, chapter: 4, verse: 13 },
  { id: '1-tesalonicenses-4-14', prompt: '¿Te preguntas qué ocurrirá después?', book: 52, chapter: 4, verse: 14 },
  { id: '1-tesalonicenses-4-16', prompt: '¿Necesitas esperanza para el futuro?', book: 52, chapter: 4, verse: 16 },
  { id: '1-tesalonicenses-4-17', prompt: '¿Anhelas el reencuentro?', book: 52, chapter: 4, verse: 17 },
  { id: 'job-19-25', prompt: '¿Necesitas recordar quién te sostiene?', book: 18, chapter: 19, verse: 25 },
  { id: 'job-19-26', prompt: '¿La incertidumbre te duele?', book: 18, chapter: 19, verse: 26 },
  { id: 'mateo-11-28', prompt: '¿Estás cansado?', book: 40, chapter: 11, verse: 28 },
  { id: 'apocalipsis-3-20', prompt: '¿Quieres acercarte a Dios?', book: 66, chapter: 3, verse: 20 },
  { id: 'isaias-41-10', prompt: '¿Necesitas fortaleza?', book: 23, chapter: 41, verse: 10 },
  { id: 'salmos-147-3', prompt: '¿Necesitas sanar?', book: 19, chapter: 147, verse: 3 },
];

function getLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getDateSeed(dateKey) {
  return [...dateKey].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function readHistory(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(DAILY_THEME_HISTORY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => (
      /^\d{4}-\d{2}-\d{2}$/.test(entry?.date)
      && DAILY_THEME_VERSES.some((theme) => theme.id === entry?.id)
    ));
  } catch {
    return [];
  }
}

function writeHistory(storage, history) {
  try {
    storage?.setItem(DAILY_THEME_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // La rotación sigue funcionando aunque el navegador bloquee el almacenamiento local.
  }
}

/**
 * Devuelve una cápsula temática estable para el día actual. No repite hasta
 * recorrer toda la guía (22 días), que es el máximo disponible en su fuente.
 */
export function getDailyTheme({ date = new Date(), storage = globalThis.localStorage } = {}) {
  const today = getLocalDateKey(date);
  const history = readHistory(storage);
  const selectedToday = history.find((entry) => entry.date === today);

  if (selectedToday) {
    return DAILY_THEME_VERSES.find((theme) => theme.id === selectedToday.id) ?? DAILY_THEME_VERSES[0];
  }

  const recentCutoff = new Date(date);
  recentCutoff.setDate(recentCutoff.getDate() - NO_REPEAT_DAYS);
  const recentIds = new Set(
    history
      .filter((entry) => entry.date >= getLocalDateKey(recentCutoff))
      .map((entry) => entry.id)
  );
  const candidates = DAILY_THEME_VERSES.filter((theme) => !recentIds.has(theme.id));
  const availableThemes = candidates.length > 0 ? candidates : DAILY_THEME_VERSES;
  const selected = availableThemes[getDateSeed(today) % availableThemes.length];
  const nextHistory = [...history.filter((entry) => entry.date !== today), { date: today, id: selected.id }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-NO_REPEAT_DAYS);

  writeHistory(storage, nextHistory);
  return selected;
}
