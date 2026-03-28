# 📖 Bible PWA — Documento Maestro del Proyecto

> Versión: 1.0 — Para uso con agente Antigravity / Codex  
> Generado con requerimientos validados por el usuario

---

## 1. RESUMEN EJECUTIVO

Aplicación web progresiva (PWA) para lectura y estudio bíblico, sin publicidad, orientada a usuarios adventistas hispanohablantes. Incluye múltiples versiones de la Biblia, comentarios en dominio público, citas de Ellen G. White enlazadas por versículo, versículo inspiracional diario, marcadores, notas y resaltado. Funciona offline, es instalable desde el browser, y se despliega en Netlify.

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Framework | React 18 + Vite |
| Estilos | CSS Modules + variables CSS (sin Tailwind) |
| Fuente tipográfica | Lora (serif, Google Fonts) — clásica y legible |
| Datos bíblicos | JSON chunkeado por libro (cargado bajo demanda) |
| Datos usuario | localStorage + IndexedDB (notas, marcadores, resaltado) |
| PWA | Vite PWA Plugin (Workbox) — service worker automático |
| Deploy | Netlify (CI/CD desde GitHub) |
| API externa | EGW Writings API (egwwritings.org) — solo para devocional diario y citas |

---

## 3. FUENTES DE DATOS — INSTRUCCIONES DE DESCARGA

### 3.1 Texto Bíblico

**RVR 1960**
- Repositorio: https://github.com/scrollmapper/bible_databases
- Archivo: `flat/t_rvr09.csv` (RVR es la más cercana disponible)
- Alternativa directa JSON: https://github.com/thiagobodruk/bible/blob/master/json/es_rvr.json
- Formato: array de objetos `{ b, c, v, t }` (book, chapter, verse, text)

**KJV (King James Version)**
- Mismo repositorio scrollmapper: `flat/t_kjv.csv`
- También: https://github.com/aruljohn/Bible-kjv (JSON por libro, listo para usar)

**Peshitá en español**
- Fuente: https://github.com/scrollmapper/bible_databases (buscar `peshitta`)
- Alternativa: exportar desde theWord.net (software gratuito, tiene Peshitá española)
- Si no se encuentra limpia, usar el texto del proyecto Código Peshitta disponible en archive.org

**RVC (Reina-Valera Contemporánea)**
- Contactar: Sociedades Bíblicas de América Latina (abylatina.org)
- Para v1 usar RVR 1960 como única versión en español si no hay fuente libre confirmada
- El schema ya tiene el slot preparado (version_id = 'rvc')

### 3.2 Comentarios Bíblicos (Dominio Público)

**Matthew Henry — Commentary on the Whole Bible**
- Fuente SQLite: https://github.com/scrollmapper/bible_databases (incluido)
- Archivo JSON procesado: https://github.com/evangoer/pocket-commentary (Matthew Henry completo)
- Estructura: enlazado por book_id + chapter + verse_start + verse_end

**Jamieson-Fausset-Brown (JFB)**
- Fuente: mismo repositorio scrollmapper
- Archivo: `commentaries/` dentro del repo
- Formato: texto plano por perícopa (rango de versículos)

### 3.3 EGW Writings

**API Oficial**
- Base URL: https://a.egwwritings.org
- Documentación: https://egwwritings.org/developers
- Endpoint devocional: `GET /content/books/{book_id}/toc/` y luego por fecha
- Endpoint citas por referencia bíblica: `GET /content/books/?bible_book={book}&bible_chapter={ch}&bible_verse={v}`
- Requiere token gratuito: registrarse en https://egwwritings.org/api/

**Libros clave a mapear**
- El Deseado de todas las gentes (book_id: 130)
- El Conflicto de los Siglos (book_id: 132)
- El Camino a Cristo (book_id: 140)
- Devocional diario: "Cada Día con Dios" y "A fin de conocerle"

---

## 4. SCHEMA DE BASE DE DATOS (JSON local + localStorage)

### 4.1 Estructura de archivos JSON (cargados bajo demanda)

```
/public/data/
  versions.json               ← catálogo de versiones disponibles
  books.json                  ← lista de 66 libros con metadata
  /rvr60/
    01_genesis.json
    02_exodo.json
    ... (66 archivos)
  /kjv/
    01_genesis.json
    ...
  /peshita/
    01_genesis.json
    ...
  /commentaries/
    henry/
      01_genesis.json         ← comentario por libro (agrupa versículos)
    jfb/
      01_genesis.json
  /egw-cache/                 ← caché local de respuestas de la API EGW
    daily-{YYYY-MM-DD}.json
    verse-{book}-{ch}-{v}.json
```

### 4.2 Schema: versions.json

```json
[
  {
    "id": "rvr60",
    "name": "Reina-Valera 1960",
    "short": "RVR60",
    "lang": "es",
    "available": true,
    "source": "scrollmapper"
  },
  {
    "id": "kjv",
    "name": "King James Version",
    "short": "KJV",
    "lang": "en",
    "available": true,
    "source": "scrollmapper"
  },
  {
    "id": "peshita",
    "name": "Peshitá",
    "short": "PES",
    "lang": "es",
    "available": true,
    "source": "peshitta-project"
  },
  {
    "id": "rvc",
    "name": "Reina-Valera Contemporánea",
    "short": "RVC",
    "lang": "es",
    "available": false,
    "source": "pending-license"
  }
]
```

### 4.3 Schema: books.json

```json
[
  {
    "id": 1,
    "slug": "genesis",
    "name": "Génesis",
    "name_en": "Genesis",
    "abbrev": "Gn",
    "testament": "OT",
    "chapters": 50,
    "file": "01_genesis"
  }
  // ... 66 libros
]
```

### 4.4 Schema: archivo de libro (ej. /rvr60/01_genesis.json)

```json
{
  "version": "rvr60",
  "book": 1,
  "chapters": [
    {
      "chapter": 1,
      "verses": [
        { "verse": 1, "text": "En el principio creó Dios los cielos y la tierra." },
        { "verse": 2, "text": "Y la tierra estaba desordenada y vacía..." }
      ]
    }
  ]
}
```

### 4.5 Schema: comentario por libro (ej. /commentaries/henry/01_genesis.json)

```json
{
  "source": "matthew-henry",
  "book": 1,
  "entries": [
    {
      "chapter": 1,
      "verse_start": 1,
      "verse_end": 2,
      "title": "The Creation",
      "text": "Here is the beginning of time as well as matter...",
      "lang": "en"
    }
  ]
}
```

### 4.6 Schema: datos de usuario (localStorage/IndexedDB)

```javascript
// localStorage keys
'bible_settings'  →  {
  version: 'rvr60',
  theme: 'sepia',           // 'light' | 'dark' | 'sepia'
  fontSize: 'md',           // 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: 'serif',      // 'serif' (Lora) | 'sans'
  lastRead: { book: 1, chapter: 1 }
}

'bible_recent'  →  [
  { book: 43, chapter: 3, ts: 1700000000 },  // máx. 10 entradas
]

// IndexedDB: database = 'bible_user_data', version 1
// Store: 'bookmarks'
{
  id: 'rvr60-43-3-16',    // version-book-chapter-verse
  version: 'rvr60',
  book: 43,
  chapter: 3,
  verse: 16,
  createdAt: timestamp
}

// Store: 'notes'
{
  id: 'rvr60-43-3-16',
  version: 'rvr60',
  book: 43,
  chapter: 3,
  verse: 16,
  text: 'Nota del usuario aquí...',
  updatedAt: timestamp
}

// Store: 'highlights'
{
  id: 'rvr60-43-3-16',
  version: 'rvr60',
  book: 43,
  chapter: 3,
  verse: 16,
  color: 'yellow',    // 'yellow' | 'green' | 'blue' | 'pink'
  createdAt: timestamp
}

// Store: 'egw_cache'
{
  key: 'verse-43-3-16',
  data: { /* respuesta API EGW */ },
  cachedAt: timestamp,
  expiresAt: timestamp  // 7 días
}
```

---

## 5. ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
bible-pwa/
├── public/
│   ├── data/
│   │   ├── versions.json
│   │   ├── books.json
│   │   ├── rvr60/          ← 66 archivos JSON
│   │   ├── kjv/            ← 66 archivos JSON
│   │   ├── peshita/        ← 66 archivos JSON
│   │   └── commentaries/
│   │       ├── henry/      ← 66 archivos JSON
│   │       └── jfb/        ← 66 archivos JSON
│   ├── icons/              ← PWA icons (512, 192, 144, 96, 48)
│   ├── manifest.json
│   └── offline.html
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.module.css
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        ← contenedor principal, barra nav, drawer
│   │   │   ├── TopBar.jsx          ← título libro/cap, selector versión, config
│   │   │   ├── BookDrawer.jsx      ← panel lateral: 66 libros → capítulos
│   │   │   └── BottomNav.jsx       ← Inicio | Buscar | Marcadores | Ajustes
│   │   │
│   │   ├── reader/
│   │   │   ├── ChapterView.jsx     ← renderiza capítulo completo
│   │   │   ├── VerseBlock.jsx      ← un versículo con número, tap, highlight
│   │   │   ├── VerseMenu.jsx       ← menú contextual al mantener tap: notas, marcar, comentario
│   │   │   └── CommentaryPopup.jsx ← popup flotante con Henry/JFB + citas EGW
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.jsx
│   │   │   └── SearchResults.jsx
│   │   │
│   │   ├── daily/
│   │   │   └── DailyVerse.jsx      ← versículo del día + cita EGW devocional
│   │   │
│   │   └── ui/
│   │       ├── ThemeToggle.jsx
│   │       ├── FontSizeControl.jsx
│   │       └── VersionSelector.jsx
│   │
│   ├── hooks/
│   │   ├── useBible.js         ← carga JSON del libro activo (lazy)
│   │   ├── useBookmarks.js     ← CRUD marcadores en IndexedDB
│   │   ├── useNotes.js         ← CRUD notas en IndexedDB
│   │   ├── useHighlights.js    ← CRUD resaltado en IndexedDB
│   │   ├── useSettings.js      ← lee/escribe localStorage
│   │   ├── useSearch.js        ← búsqueda por texto en JSON cargados
│   │   └── useEGW.js           ← fetch API EGW + caché IndexedDB
│   │
│   ├── services/
│   │   ├── bibleLoader.js      ← fetch y caché de chunks JSON
│   │   ├── commentaryLoader.js ← fetch comentarios por libro
│   │   ├── egwApi.js           ← wrapper de la API egwwritings.org
│   │   ├── db.js               ← inicialización IndexedDB (idb-keyval o raw)
│   │   └── dailyVerse.js       ← lógica versículo del día (seed por fecha)
│   │
│   ├── data/
│   │   └── books-meta.js       ← metadata de 66 libros (inline, no fetch)
│   │
│   └── styles/
│       ├── tokens.css          ← variables CSS: colores, tipografía, espaciado
│       ├── themes.css          ← [data-theme="light|dark|sepia"] overrides
│       └── global.css
│
├── scripts/
│   ├── convert-scrollmapper.js ← convierte CSV/SQLite → JSON chunks
│   ├── convert-commentary.js   ← convierte comentarios → JSON por libro
│   └── fetch-egw-refs.js       ← pre-descarga citas EGW por libro (opcional)
│
├── vite.config.js
├── vite-pwa.config.js
├── netlify.toml
├── package.json
└── README.md
```

---

## 6. VARIABLES CSS — SISTEMA DE TEMAS

```css
/* tokens.css */
:root {
  --font-body: 'Lora', Georgia, serif;
  --font-ui: 'Inter', system-ui, sans-serif;

  --font-size-sm: 15px;
  --font-size-md: 18px;
  --font-size-lg: 21px;
  --font-size-xl: 25px;

  --line-height-reading: 1.85;
  --max-width-reader: 680px;
}

/* themes.css */
[data-theme="light"] {
  --bg-page: #FAFAF7;
  --bg-surface: #FFFFFF;
  --bg-verse-hover: #F0EFE8;
  --text-primary: #1A1A18;
  --text-secondary: #5C5B54;
  --text-verse-num: #A8A69E;
  --accent: #6B4F2C;
  --highlight-yellow: #FFF3B0;
  --highlight-green: #D4F0D4;
  --highlight-blue: #D0E8FF;
  --highlight-pink: #FFD6E7;
  --border: #E8E6DF;
}

[data-theme="dark"] {
  --bg-page: #141410;
  --bg-surface: #1E1E1A;
  --bg-verse-hover: #272722;
  --text-primary: #E8E6DC;
  --text-secondary: #9A9890;
  --text-verse-num: #4A4840;
  --accent: #C49A6C;
  --border: #2E2E28;
}

[data-theme="sepia"] {
  --bg-page: #F4ECD8;
  --bg-surface: #FAF3E3;
  --bg-verse-hover: #EDE0C4;
  --text-primary: #2C1E0F;
  --text-secondary: #6B5740;
  --text-verse-num: #B09070;
  --accent: #8B4513;
  --border: #D4C4A0;
}
```

---

## 7. FUNCIONALIDADES CLAVE — ESPECIFICACIONES

### 7.1 Lector principal (ChapterView)

- Texto en columna única centrada, max-width 680px, padding lateral 20px
- Párrafo continuo: versículos NO separados por saltos de línea, fluyen como prosa
- Número de versículo: superíndice inline, color `--text-verse-num`, font-size 70%
- Tap corto en versículo: resaltarlo visualmente (border-left 3px accent)
- Tap largo (500ms) en versículo: abrir VerseMenu (opciones: 📑 Comentario, 🔖 Marcar, ✏️ Nota, 🎨 Resaltar, 📤 Compartir)
- Swipe horizontal: cambiar capítulo (izquierda = siguiente, derecha = anterior)
- Scroll vertical: lectura normal
- Versículo activo desde URL: `/read/juan/3/16` hace scroll y resalta v.16

### 7.2 Selector de versión

- Ubicado en TopBar, dropdown compacto
- Muestra: RVR60 | KJV | PES (las disponibles)
- Al cambiar: recarga el JSON del mismo libro/capítulo sin cambiar posición
- RVC aparece como "Próximamente" con badge

### 7.3 CommentaryPopup

- Se activa desde VerseMenu → "Comentario"
- Popup flotante centrado, max-height 70vh, scrollable internamente
- Tabs: [Matthew Henry] [JFB] [EGW]
- Tab EGW: llama a `useEGW.js` → si hay caché usa eso, sino hace fetch a API
- Si no hay conexión y no hay caché: muestra mensaje "Sin conexión — Conecta para ver citas EGW"
- Comentarios Henry/JFB: siempre disponibles offline (JSON local)

### 7.4 Versículo del día (DailyVerse)

- Seed determinista por fecha: `seed = year * 10000 + month * 100 + day`
- Selecciona un versículo del pool de ~200 versículos inspiracionales predefinidos
- Bajo el versículo: cita EGW relacionada (fetch API, con fallback offline de 7 citas locales)
- Se muestra en pantalla de inicio (Home) y como widget en la parte superior del lector

### 7.5 Búsqueda

- Input en TopBar, expande al hacer foco
- Búsqueda por texto: itera sobre el JSON del libro activo primero, luego expande
- Búsqueda por referencia: detecta patrón `Jn 3:16`, `Juan 3:16`, `john 3:16` → navega directo
- Resultados muestran: libro abrev. + cap:vers + snippet con término resaltado

### 7.6 PWA / Offline

- Service Worker (Workbox): cachea shell JS/CSS, todos los JSON de datos bíblicos y comentarios
- Precache: versión RVR60 completa + books.json + versions.json en primera carga
- Runtime cache: KJV, Peshitá, comentarios — se cachean bajo demanda al primer acceso
- La API EGW usa NetworkFirst con fallback a IndexedDB cache (7 días)
- manifest.json: name, short_name, icons, theme_color, display: standalone, start_url

---

## 8. PROMPT MAESTRO PARA EL AGENTE

```
# INSTRUCCIONES PARA EL AGENTE — Bible PWA

## Contexto general
Construye una Progressive Web App (PWA) para lectura y estudio bíblico llamada provisionalmente "Maranatha Bible". El proyecto está orientado a usuarios adventistas hispanohablantes. Sin publicidad. Sin backend propio. Offline-first.

## Stack obligatorio
- React 18 + Vite 5
- CSS Modules + variables CSS propias (NO usar Tailwind, NO usar UI libraries como MUI o Chakra)
- Fuente tipográfica: Lora (Google Fonts) para el texto bíblico; Inter para la UI
- Datos: JSON chunkeado por libro en /public/data/
- PWA: vite-plugin-pwa con Workbox
- Deploy target: Netlify
- NO usar ningún backend ni base de datos en servidor

## Datos y fuentes
Los archivos JSON ya estarán pre-generados en /public/data/ siguiendo el schema documentado.
El agente NO necesita generarlos, solo consumirlos.
La única API externa es egwwritings.org (EGW Writings) — el agente debe implementar el wrapper con caché en IndexedDB.

## Orden de implementación (respetar esta secuencia)

FASE 1 — Fundamentos
1. Setup del proyecto: Vite + React + vite-plugin-pwa
2. Sistema de temas CSS (light/dark/sepia) con data-theme en <html>
3. Sistema de tipografía (Lora serif, tamaños sm/md/lg/xl)
4. Estructura de rutas: / (Home), /read/:book/:chapter, /read/:book/:chapter/:verse, /search, /bookmarks, /settings
5. AppShell: TopBar + BookDrawer + BottomNav
6. Hook useBible.js: carga lazy de JSON por libro y versión

FASE 2 — Lector
7. ChapterView: renderiza capítulo como párrafo continuo con versículos numerados inline
8. VerseBlock: tap corto para seleccionar, tap largo (500ms) para VerseMenu
9. VerseMenu: acciones bookmark, note, highlight, commentary, share
10. VersionSelector: dropdown en TopBar, persiste en localStorage
11. Swipe entre capítulos (touch events nativos, no librería)

FASE 3 — Estudio
12. CommentaryPopup: popup flotante con tabs Henry / JFB / EGW
13. Hook useEGW.js: fetch a egwwritings.org API + caché 7 días en IndexedDB
14. Hook useBookmarks.js + BookmarksView
15. Hook useNotes.js: nota por versículo, textarea autoexpandible
16. Hook useHighlights.js: 4 colores, persiste en IndexedDB

FASE 4 — Descubrimiento
17. SearchBar + SearchResults: texto libre + detección de referencias bíblicas
18. DailyVerse: seed por fecha + cita EGW desde API con fallback local
19. HomeScreen: versículo del día, lecturas recientes (máx. 10), acceso rápido

FASE 5 — PWA y polish
20. Service Worker con Workbox: precache RVR60 completo + shell, runtime cache el resto
21. manifest.json completo con icons
22. offline.html para navegación sin conexión
23. Refinamiento visual: transiciones suaves entre capítulos, animación de apertura de drawer
24. Meta tags SEO + Open Graph

## Reglas de diseño (obligatorias)

- Máximo ancho del texto bíblico: 680px centrado
- Párrafo continuo: los versículos fluyen como prosa, el número es superíndice
- El número de versículo usa color tenue (--text-verse-num), nunca distraiga
- Padding lateral mínimo: 20px en móvil, 40px en desktop
- Line-height del texto bíblico: 1.85 mínimo
- Ninguna acción destructiva sin confirmación
- Todos los stores de IndexedDB inicializados en db.js centralizado
- El tema (light/dark/sepia) y el tamaño de fuente se persisten en localStorage y se aplican ANTES del primer render (en index.html, script inline, para evitar flash)

## Rutas de datos

/public/data/versions.json        → catálogo de versiones
/public/data/books.json           → 66 libros con metadata
/public/data/{version}/{n}_{slug}.json  → texto por libro (ej: rvr60/01_genesis.json)
/public/data/commentaries/henry/{n}_{slug}.json  → Matthew Henry por libro
/public/data/commentaries/jfb/{n}_{slug}.json    → JFB por libro

## Schemas JSON

Ver documento: bible-pwa-schema.md (adjunto a este prompt)

## EGW API

Base: https://a.egwwritings.org
Auth: Bearer token (registrar en egwwritings.org/api/, token va en .env como VITE_EGW_TOKEN)
Endpoint citas por versículo: GET /content/books/?bible_book={book_name}&bible_chapter={ch}&bible_verse={v}&lang=es
Endpoint devocional: implementar selección por fecha usando el endpoint de libros devocionales
Caché: guardar en IndexedDB store 'egw_cache' con key 'verse-{book}-{ch}-{v}', TTL 7 días

## Entregables esperados del agente

Al finalizar cada fase, el agente debe:
1. Confirmar qué archivos creó/modificó
2. Indicar si hay alguna dependencia de datos que el usuario deba proveer
3. No avanzar a la siguiente fase sin que el usuario confirme que la anterior funciona

## Dependencias npm a usar

react, react-dom, react-router-dom, vite, @vitejs/plugin-react, vite-plugin-pwa
idb-keyval (IndexedDB simplificado, ~1kb)
NO instalar ninguna librería adicional sin aprobación del usuario
```

---

## 9. SCRIPTS DE CONVERSIÓN DE DATOS

### scripts/convert-scrollmapper.js

```javascript
// Convierte el CSV de scrollmapper al formato JSON chunkeado por libro
// Uso: node scripts/convert-scrollmapper.js --version rvr60 --input data/t_rvr09.csv

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BOOKS = require('../src/data/books-meta.js');

async function convert(inputFile, version, outputDir) {
  const byBook = {};

  const rl = readline.createInterface({ input: fs.createReadStream(inputFile) });
  for await (const line of rl) {
    const [b, c, v, text] = line.split(',');
    const bookId = parseInt(b);
    const chapter = parseInt(c);
    const verse = parseInt(v);
    if (!byBook[bookId]) byBook[bookId] = {};
    if (!byBook[bookId][chapter]) byBook[bookId][chapter] = [];
    byBook[bookId][chapter].push({ verse, text: text.replace(/^"|"$/g, '') });
  }

  const versionDir = path.join(outputDir, version);
  fs.mkdirSync(versionDir, { recursive: true });

  for (const book of BOOKS) {
    const chapters = Object.entries(byBook[book.id] || {}).map(([ch, verses]) => ({
      chapter: parseInt(ch),
      verses
    }));
    const output = { version, book: book.id, chapters };
    const filename = `${String(book.id).padStart(2,'0')}_${book.slug}.json`;
    fs.writeFileSync(path.join(versionDir, filename), JSON.stringify(output));
    console.log(`✓ ${filename}`);
  }
}

const args = process.argv.slice(2);
const version = args[args.indexOf('--version') + 1];
const input = args[args.indexOf('--input') + 1];
convert(input, version, 'public/data').then(() => console.log('Conversión completa.'));
```

---

## 10. CHECKLIST DE LANZAMIENTO

- [ ] RVR60 JSON completo (66 libros) en /public/data/rvr60/
- [ ] KJV JSON completo en /public/data/kjv/
- [ ] Peshitá JSON en /public/data/peshita/ (o marcar como "próximamente")
- [ ] Matthew Henry JSON en /public/data/commentaries/henry/
- [ ] JFB JSON en /public/data/commentaries/jfb/
- [ ] Token EGW registrado y en .env (VITE_EGW_TOKEN)
- [ ] PWA icons generados (usar realfavicongenerator.net)
- [ ] manifest.json con name, icons, theme_color: #6B4F2C, background_color según tema
- [ ] Netlify: configurar redirects (_redirects: `/* /index.html 200`)
- [ ] Probar instalación en Android Chrome y iOS Safari
- [ ] Probar modo offline completo (DevTools → Network → Offline)
- [ ] Lighthouse PWA score: apuntar a 95+

---

*Documento generado para el proyecto Bible PWA — listo para usar con Antigravity / Codex / Claude Code*
