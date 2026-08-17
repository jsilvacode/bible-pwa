const CYCLE_START = Date.UTC(2026, 0, 1);

const entry = (id, message, book, chapter, verse) => ({
  id,
  message,
  book,
  chapter,
  verse,
});

// Pan de vida: una guía editorial de 90 días. Cada columna corresponde a un
// momento humano y el ciclo los entrelaza para que la experiencia no sea
// monotemática. La selección usa solo referencias verificables en las tres
// versiones que ofrece la aplicación.
const THEMES_BY_MOMENT = [
  [
    entry('isaias-41-10', 'Cuando el miedo toca a la puerta', 23, 41, 10),
    entry('josue-1-9', 'Cuando debes dar un paso difícil', 6, 1, 9),
    entry('salmos-27-1', 'Cuando la oscuridad parece mayor', 19, 27, 1),
    entry('salmos-56-3', 'Cuando necesitas volver a confiar', 19, 56, 3),
    entry('salmos-91-1', 'Cuando buscas un lugar seguro', 19, 91, 1),
    entry('1-juan-4-18', 'Cuando el temor insiste', 62, 4, 18),
    entry('2-timoteo-1-7', 'Cuando necesitas recuperar el ánimo', 55, 1, 7),
    entry('juan-14-27', 'Cuando tu paz se siente frágil', 43, 14, 27),
    entry('romanos-8-38', 'Cuando nada parece seguro', 45, 8, 38),
  ],
  [
    entry('salmos-34-18', 'Cuando el corazón se quiebra', 19, 34, 18),
    entry('salmos-42-11', 'Cuando el alma pierde fuerzas', 19, 42, 11),
    entry('mateo-5-4', 'Cuando llorar es parte del camino', 40, 5, 4),
    entry('salmos-30-5', 'Cuando esperas que vuelva la alegría', 19, 30, 5),
    entry('apocalipsis-21-4', 'Cuando anhelas un mundo sin dolor', 66, 21, 4),
    entry('juan-16-22', 'Cuando el dolor de hoy parece definitivo', 43, 16, 22),
    entry('salmos-147-3', 'Cuando tus heridas necesitan tiempo', 19, 147, 3),
    entry('isaias-61-1', 'Cuando necesitas consuelo en medio de la pérdida', 23, 61, 1),
    entry('2-corintios-1-3', 'Cuando las cargas son muchas', 47, 1, 3),
  ],
  [
    entry('salmos-103-2', 'Cuando el cuerpo necesita descanso y cuidado', 19, 103, 2),
    entry('jeremias-17-14', 'Cuando pides restauración', 24, 17, 14),
    entry('isaias-53-4', 'Cuando te sientes frágil', 23, 53, 4),
    entry('3-juan-1-2', 'Cuando deseas bienestar integral', 64, 1, 2),
    entry('santiago-5-15', 'Cuando la enfermedad reúne a la comunidad', 59, 5, 15),
    entry('mateo-11-28', 'Cuando estás agotado', 40, 11, 28),
    entry('salmos-46-1', 'Cuando ya no puedes más', 19, 46, 1),
    entry('exodo-15-26', 'Cuando buscas cuidado en medio de la enfermedad', 2, 15, 26),
    entry('2-corintios-12-9', 'Cuando la debilidad no desaparece', 47, 12, 9),
  ],
  [
    entry('jeremias-29-11', 'Cuando el mañana se vuelve incierto', 24, 29, 11),
    entry('romanos-15-13', 'Cuando necesitas que la esperanza vuelva a crecer', 45, 15, 13),
    entry('salmos-39-7', 'Cuando no sabes qué esperar', 19, 39, 7),
    entry('lamentaciones-3-22', 'Cuando necesitas misericordia para empezar de nuevo', 25, 3, 22),
    entry('hebreos-10-23', 'Cuando sostener la esperanza cuesta', 58, 10, 23),
    entry('romanos-8-24', 'Cuando todavía no ves la respuesta', 45, 8, 24),
    entry('miqueas-7-7', 'Cuando decides esperar con los ojos abiertos', 33, 7, 7),
    entry('salmos-62-5', 'Cuando el alma necesita quietud', 19, 62, 5),
    entry('1-pedro-1-3', 'Cuando necesitas una esperanza viva', 60, 1, 3),
  ],
  [
    entry('juan-11-25', 'Cuando extrañas a quien partió', 43, 11, 25),
    entry('1-tesalonicenses-4-13', 'Cuando el duelo deja preguntas', 52, 4, 13),
    entry('1-tesalonicenses-4-16', 'Cuando anhelas el reencuentro', 52, 4, 16),
    entry('job-19-25', 'Cuando necesitas recordar quién te sostiene', 18, 19, 25),
    entry('apocalipsis-14-13', 'Cuando descansas en una promesa mayor', 66, 14, 13),
    entry('salmos-23-4', 'Cuando caminas por un valle oscuro', 19, 23, 4),
    entry('2-corintios-4-17', 'Cuando la aflicción parece demasiado pesada', 47, 4, 17),
    entry('juan-14-1', 'Cuando el corazón necesita descanso', 43, 14, 1),
    entry('filipenses-1-21', 'Cuando la vida necesita una perspectiva eterna', 50, 1, 21),
  ],
  [
    entry('isaias-40-31', 'Cuando tus fuerzas se están agotando', 23, 40, 31),
    entry('galatas-6-9', 'Cuando hacer el bien cansa', 48, 6, 9),
    entry('salmos-73-26', 'Cuando el corazón y el cuerpo desfallecen', 19, 73, 26),
    entry('1-pedro-5-7', 'Cuando llevas demasiadas preocupaciones', 60, 5, 7),
    entry('filipenses-4-6', 'Cuando la ansiedad quiere ocuparlo todo', 50, 4, 6),
    entry('salmos-55-22', 'Cuando necesitas soltar una carga', 19, 55, 22),
    entry('hebreos-4-16', 'Cuando necesitas ayuda a tiempo', 58, 4, 16),
    entry('salmos-121-1', 'Cuando buscas de dónde vendrá tu auxilio', 19, 121, 1),
    entry('mateo-6-34', 'Cuando el mañana trae demasiada preocupación', 40, 6, 34),
  ],
  [
    entry('proverbios-3-5', 'Cuando una decisión parece confusa', 20, 3, 5),
    entry('proverbios-3-6', 'Cuando buscas el siguiente paso', 20, 3, 6),
    entry('salmos-32-8', 'Cuando necesitas orientación', 19, 32, 8),
    entry('santiago-1-5', 'Cuando te falta sabiduría', 59, 1, 5),
    entry('salmos-119-105', 'Cuando el camino necesita luz', 19, 119, 105),
    entry('isaias-30-21', 'Cuando temes elegir mal', 23, 30, 21),
    entry('salmos-25-4', 'Cuando quieres aprender el camino correcto', 19, 25, 4),
    entry('juan-16-13', 'Cuando necesitas verdad para avanzar', 43, 16, 13),
    entry('romanos-12-2', 'Cuando buscas discernir lo que es bueno', 45, 12, 2),
  ],
  [
    entry('deuteronomio-31-8', 'Cuando te sientes solo en el camino', 5, 31, 8),
    entry('hebreos-13-5', 'Cuando necesitas recordar que no estás abandonado', 58, 13, 5),
    entry('mateo-28-20', 'Cuando el camino parece demasiado largo', 40, 28, 20),
    entry('salmos-68-6', 'Cuando anhelas pertenecer', 19, 68, 6),
    entry('juan-14-18', 'Cuando la soledad se hace presente', 43, 14, 18),
    entry('salmos-139-7', 'Cuando te preguntas si Dios sigue cerca', 19, 139, 7),
    entry('isaias-43-2', 'Cuando atraviesas aguas profundas', 23, 43, 2),
    entry('salmos-27-10', 'Cuando necesitas sentirte recibido', 19, 27, 10),
    entry('2-timoteo-4-17', 'Cuando necesitas fuerza para permanecer', 55, 4, 17),
  ],
  [
    entry('marcos-9-24', 'Cuando la fe se siente pequeña', 41, 9, 24),
    entry('hebreos-11-1', 'Cuando eliges confiar sin verlo todo', 58, 11, 1),
    entry('lucas-1-37', 'Cuando una posibilidad parece imposible', 42, 1, 37),
    entry('filipenses-4-13', 'Cuando necesitas valentía para continuar', 50, 4, 13),
    entry('1-corintios-16-13', 'Cuando necesitas mantenerte firme', 46, 16, 13),
    entry('santiago-1-2', 'Cuando las pruebas te están formando', 59, 1, 2),
    entry('salmos-118-24', 'Cuando recibes este día como un regalo', 19, 118, 24),
    entry('1-tesalonicenses-5-18', 'Cuando quieres agradecer aun en medio de todo', 52, 5, 18),
    entry('colosenses-3-15', 'Cuando la gratitud necesita volver al centro', 51, 3, 15),
  ],
  [
    entry('1-juan-1-9', 'Cuando necesitas comenzar de nuevo', 62, 1, 9),
    entry('romanos-8-1', 'Cuando la culpa pesa demasiado', 45, 8, 1),
    entry('salmos-51-10', 'Cuando deseas un corazón renovado', 19, 51, 10),
    entry('miqueas-7-18', 'Cuando necesitas recordar la misericordia', 33, 7, 18),
    entry('isaias-1-18', 'Cuando buscas una segunda oportunidad', 23, 1, 18),
    entry('efesios-4-32', 'Cuando perdonar parece difícil', 49, 4, 32),
    entry('colosenses-3-13', 'Cuando una relación necesita paciencia', 51, 3, 13),
    entry('juan-3-16', 'Cuando necesitas recordar cuánto eres amado', 43, 3, 16),
    entry('romanos-5-8', 'Cuando el amor de Dios parece lejano', 45, 5, 8),
  ],
];

export const DAILY_THEME_VERSES = Array.from(
  { length: THEMES_BY_MOMENT[0].length },
  (_, day) => THEMES_BY_MOMENT.map((themes) => themes[day])
).flat();

function getDayStamp(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Devuelve la cápsula editorial que corresponde al día. El ciclo de 90 días
 * es estable para cualquier persona y no depende de que haya abierto la app
 * los días anteriores.
 */
export function getDailyTheme({ date = new Date() } = {}) {
  const totalDays = Math.floor((getDayStamp(date) - CYCLE_START) / 86_400_000);
  const index = ((totalDays % DAILY_THEME_VERSES.length) + DAILY_THEME_VERSES.length)
    % DAILY_THEME_VERSES.length;

  return DAILY_THEME_VERSES[index];
}
