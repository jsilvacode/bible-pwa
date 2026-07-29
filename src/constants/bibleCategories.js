export const BIBLE_CATEGORIES = [
  {
    id: 'pentateuch',
    label: 'Pentateuco',
    name: 'Pentateuco',
    icon: '📜',
    count: '5 libros',
    min: 1,
    max: 5,
  },
  {
    id: 'historical',
    label: 'Libros Históricos',
    name: 'Libros Históricos',
    icon: '⚔️',
    count: '12 libros',
    min: 6,
    max: 17,
  },
  {
    id: 'wisdom',
    label: 'Salmos y Sabiduría',
    name: 'Salmos y Sabiduría',
    icon: '🎵',
    count: '5 libros',
    min: 18,
    max: 22,
  },
  {
    id: 'prophets',
    label: 'Profetas',
    name: 'Profetas',
    icon: '📣',
    count: '17 libros',
    min: 23,
    max: 39,
  },
  {
    id: 'gospels',
    label: 'Evangelios y Hechos',
    name: 'Evangelios y Hechos',
    icon: '✝️',
    count: '5 libros',
    min: 40,
    max: 44,
  },
  {
    id: 'epistles',
    label: 'Epístolas y Apocalipsis',
    name: 'Epístolas y Apoc.',
    icon: '✉️',
    count: '22 libros',
    min: 45,
    max: 66,
  },
];

/** @type {Record<string, { min: number, max: number }>} */
export const CATEGORY_RANGES = Object.fromEntries(
  BIBLE_CATEGORIES.map((c) => [c.id, { min: c.min, max: c.max }])
);

/** @type {Record<string, string>} */
export const CATEGORY_LABELS = Object.fromEntries(
  BIBLE_CATEGORIES.map((c) => [c.id, c.label])
);
