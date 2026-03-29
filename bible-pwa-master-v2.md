# 📖 Santa Biblia PWA — Documento Maestro v2.1
> Para uso con agente Antigravity / Codex / Claude Code  
> Actualizado con infraestructura completa verificada — listo para desarrollo

---

## 1. RESUMEN DEL PROYECTO

PWA para lectura y estudio bíblico, sin publicidad, orientada a usuarios adventistas hispanohablantes. Funciona offline, es instalable desde el browser, y se despliega en Netlify.

**Nombre de la app:** Santa Biblia  
**Repositorio GitHub:** https://github.com/jsilvacode/bible-pwa  
**Deploy:** https://santa-biblia.netlify.app  
**Deploy automático:** sí — cada `git push` a `main` redespliega automáticamente  

---

## 2. ESTADO ACTUAL DE LOS DATOS

### ✅ Datos disponibles y listos

```
/Users/zeus/proyectos/bible-pwa/public/data/
  rvr60/   ← 66 libros JSON generados y verificados
  kjv/     ← 66 libros JSON generados y verificados
```

### ⏳ Datos pendientes para v1.1
- **Peshitá en español** — no hay fuente JSON libre disponible aún
- **Matthew Henry / JFB** — comentarios, pendiente de fuente
- **EGW Writings** — integración API pendiente (ver sección 8)

---

## 3. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Framework | React 18 + Vite 5 |
| Estilos | CSS Modules + variables CSS propias (sin Tailwind, sin UI libraries) |
| Tipografía | Lora (serif, Google Fonts) para texto bíblico · Inter para UI |
| Datos bíblicos | JSON chunkeado por libro en /public/data/ |
| Datos usuario | localStorage + IndexedDB |
| PWA | vite-plugin-pwa con Workbox |
| Deploy | Netlify |
| API externa | EGW Writings (egwwritings.org) — implementar en Fase 4 |

---

## 4. ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
/Users/zeus/proyectos/bible-pwa/
├── public/
│   ├── data/
│   │   ├── versions.json          ← CREAR (catálogo de versiones)
│   │   ├── books.json             ← CREAR (66 libros con metadata)
│   │   ├── rvr60/                 ← YA EXISTE (66 archivos JSON)
│   │   │   ├── 01_genesis.json
│   │   │   └── ... (66 libros)
│   │   ├── kjv/                   ← YA EXISTE (66 archivos JSON)
│   │   │   ├── 01_genesis.json
│   │   │   └── ... (66 libros)
│   │   └── commentaries/          ← CREAR estructura vacía para v1.1
│   │       ├── henry/
│   │       └── jfb/
│   ├── icons/                     ← CREAR (PWA icons)
│   ├── manifest.json              ← CREAR
│   └── offline.html               ← CREAR
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.module.css
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx       ← contenedor principal
│   │   │   ├── TopBar.jsx         ← título libro/cap, selector versión, config
│   │   │   ├── BookDrawer.jsx     ← panel lateral: 66 libros → capítulos
│   │   │   └── BottomNav.jsx      ← Inicio | Buscar | Marcadores | Ajustes
│   │   │
│   │   ├── reader/
│   │   │   ├── ChapterView.jsx    ← renderiza capítulo completo
│   │   │   ├── VerseBlock.jsx     ← versículo con número, tap, highlight
│   │   │   ├── VerseMenu.jsx      ← menú contextual (tap largo 500ms)
│   │   │   └── CommentaryPopup.jsx ← popup flotante (preparado para v1.1)
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.jsx
│   │   │   └── SearchResults.jsx
│   │   │
│   │   ├── daily/
│   │   │   └── DailyVerse.jsx     ← versículo del día + cita EGW (Fase 4)
│   │   │
│   │   └── ui/
│   │       ├── ThemeToggle.jsx
│   │       ├── FontSizeControl.jsx
│   │       └── VersionSelector.jsx
│   │
│   ├── hooks/
│   │   ├── useBible.js            ← carga JSON del libro activo (lazy)
│   │   ├── useBookmarks.js        ← CRUD marcadores en IndexedDB
│   │   ├── useNotes.js            ← CRUD notas en IndexedDB
│   │   ├── useHighlights.js       ← CRUD resaltado en IndexedDB
│   │   ├── useSettings.js         ← lee/escribe localStorage
│   │   ├── useSearch.js           ← búsqueda por texto en JSON cargados
│   │   └── useEGW.js              ← fetch API EGW + caché IndexedDB (Fase 4)
│   │
│   ├── services/
│   │   ├── bibleLoader.js         ← fetch y caché de chunks JSON
│   │   ├── db.js                  ← inicialización IndexedDB centralizada
│   │   └── dailyVerse.js          ← lógica versículo del día por fecha
│   │
│   ├── data/
│   │   └── books-meta.js          ← YA EXISTE en src/data/books-meta.js
│   │
│   └── styles/
│       ├── tokens.css             ← variables CSS globales
│       ├── themes.css             ← temas light/dark/sepia
│       └── global.css
│
├── scripts/                       ← YA EXISTE (scripts de conversión, no tocar)
│   ├── books-meta.js              ← referencia interna del script
│   ├── convert-rvr60.js
│   └── convert-kjv.js
│
├── src/data/
│   └── books-meta.js              ← YA EXISTE — NO regenerar
│
├── vite.config.js
├── netlify.toml
├── package.json
└── README.md
```

---

## 5. SCHEMA JSON — FORMATO REAL DE LOS DATOS

### 5.1 Formato real de los archivos de texto bíblico (ya generados)

Cada archivo en `/public/data/rvr60/` y `/public/data/kjv/` tiene esta estructura exacta:

```json
{
  "version": "rvr60",
  "book": 1,
  "name": "Génesis",
  "chapters": [
    {
      "chapter": 1,
      "verses": [
        { "verse": 1, "text": "EN el principio crió Dios los cielos y la tierra." },
        { "verse": 2, "text": "Y la tierra estaba desordenada y vacía..." }
      ]
    }
  ]
}
```

### 5.2 versions.json — CREAR este archivo

```json
[
  {
    "id": "rvr60",
    "name": "Reina-Valera 1960",
    "short": "RVR60",
    "lang": "es",
    "available": true
  },
  {
    "id": "kjv",
    "name": "King James Version",
    "short": "KJV",
    "lang": "en",
    "available": true
  },
  {
    "id": "peshita",
    "name": "Peshitá",
    "short": "PES",
    "lang": "es",
    "available": false,
    "comingSoon": true
  }
]
```

### 5.3 books.json — CREAR este archivo

Generarlo a partir de `src/data/books-meta.js` que ya existe. Cada entrada:

```json
[
  {
    "id": 1,
    "slug": "genesis",
    "name": "Génesis",
    "abbrev": "Gn",
    "testament": "OT",
    "chapters": 50,
    "file": "01_genesis"
  }
]
```

### 5.4 IndexedDB — stores de datos de usuario

```javascript
// database: 'bible_user_data', version: 1

// store: 'bookmarks'
{ id: 'rvr60-1-1-1', version, book, chapter, verse, createdAt }

// store: 'notes'
{ id: 'rvr60-1-1-1', version, book, chapter, verse, text, updatedAt }

// store: 'highlights'
{ id: 'rvr60-1-1-1', version, book, chapter, verse, color, createdAt }
// color: 'yellow' | 'green' | 'blue' | 'pink'

// store: 'egw_cache'
{ key: 'verse-1-1-1', data: {}, cachedAt, expiresAt }
```

### 5.5 localStorage

```javascript
'bible_settings' → {
  version: 'rvr60',       // versión activa
  theme: 'light',         // 'light' | 'dark' | 'sepia'
  fontSize: 'md',         // 'sm' | 'md' | 'lg' | 'xl'
  lastRead: { book: 1, chapter: 1 }
}

'bible_recent' → [
  { book: 43, chapter: 3, ts: 1700000000 }
  // máximo 10 entradas, más reciente primero
]
```

---

## 6. SISTEMA DE TEMAS Y TIPOGRAFÍA

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

**CRÍTICO — aplicar tema antes del primer render** para evitar flash. En `index.html`, antes de cargar React:

```html
<script>
  const t = localStorage.getItem('bible_settings');
  const theme = t ? JSON.parse(t).theme : 'light';
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

---

## 7. ESPECIFICACIONES DE FUNCIONALIDAD

### 7.1 Rutas de la app

```
/                          → Home (versículo del día + lecturas recientes)
/read/:book/:chapter       → Lector (ej: /read/juan/3)
/read/:book/:chapter/:verse → Lector con versículo resaltado (ej: /read/juan/3/16)
/search                    → Búsqueda
/bookmarks                 → Marcadores guardados
/settings                  → Ajustes (tema, fuente, versión)
```

### 7.2 Lector (ChapterView)

- Texto en columna única centrada, max-width 680px, padding 20px móvil / 40px desktop
- **Párrafo continuo**: versículos fluyen como prosa, NO separados por saltos de línea
- Número de versículo: superíndice inline, color `--text-verse-num`, font-size 70%, font-family UI
- **Tap corto** en versículo: resaltarlo con border-left 3px `--accent`
- **Tap largo (500ms)** en versículo: abrir VerseMenu
- VerseMenu opciones: 📑 Comentario · 🔖 Marcar · ✏️ Nota · 🎨 Resaltar · 📤 Compartir
- **Swipe horizontal**: cambiar capítulo (izquierda = siguiente, derecha = anterior) — touch events nativos, sin librería
- Texto justificado (`text-align: justify`)

### 7.3 VersionSelector

- Dropdown en TopBar
- Opciones disponibles: RVR60 · KJV
- Peshitá aparece como "Próximamente" con badge gris, no seleccionable
- Al cambiar versión: recarga JSON del mismo libro/capítulo, mantiene posición de scroll
- Persiste en localStorage

### 7.4 CommentaryPopup (preparado, sin contenido en v1)

- Se activa desde VerseMenu → "Comentario"
- Popup flotante centrado, max-height 70vh, scrollable
- En v1 mostrar: "Comentarios disponibles próximamente"
- Estructura con tabs ya preparada: [Matthew Henry] [JFB] [EGW]
- El hook y la lógica de carga se implementan en v1.1

### 7.5 Búsqueda

- Input en TopBar, expande al hacer foco
- Detecta referencias bíblicas: `Jn 3:16`, `Juan 3:16`, `john 3:16` → navega directo
- Búsqueda por texto: busca en el libro activo primero, luego en toda la versión activa
- Resultados: libro abrev. + cap:vers + snippet con término resaltado
- Mínimo 3 caracteres para activar búsqueda

### 7.6 Versículo del día (DailyVerse)

- Seed determinista por fecha: `seed = year * 10000 + month * 100 + day`
- Pool de 50 versículos inspiracionales hardcodeados en el bundle (no requiere API)
- Mostrar en Home y como banner colapsable en el lector
- En v1: sin cita EGW (se agrega en Fase 4)

### 7.7 Marcadores, Notas y Resaltado

- Todos persisten en IndexedDB, store separado por tipo
- Marcadores: lista en `/bookmarks`, agrupados por libro
- Notas: textarea autoexpandible, se abre desde VerseMenu
- Resaltado: 4 colores (amarillo, verde, azul, rosado), se aplica como background-color al versículo
- Lecturas recientes: máximo 10, guardadas en localStorage

### 7.8 PWA y Offline

- Service Worker con Workbox (vite-plugin-pwa)
- **Precache en primera carga**: shell JS/CSS + RVR60 completo (66 JSON) + books.json + versions.json
- **Runtime cache**: KJV se cachea al primer acceso a cualquier libro
- Estrategia: CacheFirst para JSON bíblicos, NetworkFirst para API EGW
- `netlify.toml` debe incluir redirect: `/* → /index.html` (SPA routing)
- `manifest.json`: display standalone, theme_color #6B4F2C, background_color según tema

---

## 8. INTEGRACIÓN EGW — FASE 4 (implementar al final)

La aplicación ya está registrada en EGW Writings. Las credenciales están listas.

**Panel:** https://cpanel.egwwritings.org  
**Token endpoint:** https://cpanel.egwwritings.org/connect/token  
**API base:** https://a.egwwritings.org  
**Redirect URI registrado:** https://santa-biblia.netlify.app/callback  

**Configuración de API EGW:** Las credenciales (ID, Secret, URI) se gestionan exclusivamente a través de variables de entorno en el panel de Netlify por razones de seguridad (Secrets Scanning). No deben incluirse en este repositorio.

**⚠️ SEGURIDAD CRÍTICA:** El `CLIENT_SECRET` nunca debe ir al bundle del frontend. Se usa exclusivamente en las Netlify Functions (`netlify/functions/`).

**⚠️ SEGURIDAD CRÍTICA:** El `CLIENT_SECRET` nunca debe ir al bundle del frontend.
Implementar una **Netlify Function** como proxy:
- Archivo: `netlify/functions/egw-token.js`
- Recibe el auth code del cliente
- Hace el intercambio con el secret en el servidor
- Devuelve solo el access token al cliente
- El cliente nunca ve el secret

**Endpoints a implementar:**
```
GET /search/?query={referencia}&lang=es   ← citas por referencia bíblica
GET /content/folders/                      ← libros devocionales disponibles
```

**Caché:** guardar respuestas en IndexedDB store `egw_cache`, TTL 7 días.

**Fallback offline:** incluir 7 citas EGW hardcodeadas en el bundle para el versículo del día cuando no hay conexión.

---

## 9. ORDEN DE IMPLEMENTACIÓN — 5 FASES

### FASE 1 — Fundamentos
1. Inicializar proyecto: `npm create vite@latest . -- --template react`
2. Instalar dependencias: `react-router-dom`, `vite-plugin-pwa`, `idb-keyval`
3. Crear `tokens.css`, `themes.css`, `global.css`
4. Script inline en `index.html` para aplicar tema antes del render
5. Importar Lora e Inter desde Google Fonts en `index.html`
6. Configurar React Router con las 6 rutas definidas
7. Crear `AppShell`, `TopBar`, `BottomNav` — navegación funcional
8. Crear `services/db.js` — inicializar IndexedDB con los 3 stores
9. Crear `hooks/useSettings.js` — leer/escribir localStorage
10. Crear `/public/data/versions.json` y `/public/data/books.json`

### FASE 2 — Lector
11. Crear `hooks/useBible.js` — carga lazy de JSON por libro y versión
12. Crear `BookDrawer.jsx` — lista de 66 libros → capítulos al hacer clic
13. Crear `ChapterView.jsx` — renderizar capítulo como párrafo continuo
14. Crear `VerseBlock.jsx` — tap corto selecciona, tap largo abre menú
15. Crear `VerseMenu.jsx` — menú contextual con 5 acciones
16. Crear `VersionSelector.jsx` — dropdown en TopBar
17. Implementar swipe entre capítulos con touch events nativos
18. Scroll automático al versículo cuando viene en la URL

### FASE 3 — Estudio personal
19. Crear `hooks/useBookmarks.js` + vista `/bookmarks`
20. Crear `hooks/useNotes.js` — nota por versículo desde VerseMenu
21. Crear `hooks/useHighlights.js` — 4 colores, persiste en IndexedDB
22. Crear `SearchBar.jsx` + `SearchResults.jsx` + `hooks/useSearch.js`
23. Crear `DailyVerse.jsx` — versículo del día por seed de fecha
24. Crear `HomeScreen.jsx` — versículo del día + lecturas recientes
25. Crear `/settings` — tema, tamaño fuente, versión por defecto
26. Crear `CommentaryPopup.jsx` — estructura con tabs, mensaje "próximamente"

### FASE 4 — EGW y refinamiento
27. Implementar `hooks/useEGW.js` — OAuth2 + caché IndexedDB
28. Conectar EGW al CommentaryPopup tab EGW
29. Agregar cita EGW al DailyVerse
30. Refinar transiciones entre capítulos (CSS transitions)
31. Animación de apertura/cierre del BookDrawer
32. Optimizar rendimiento: virtualizar listas largas (Salmos 119, etc.)

### FASE 5 — PWA y deploy
33. Configurar `vite-plugin-pwa` con Workbox
34. Precache RVR60 completo en service worker
35. Crear `manifest.json` con icons
36. Crear `offline.html`
37. Crear `netlify.toml` con redirects SPA
38. Deploy a Netlify desde GitHub
39. Lighthouse audit: apuntar PWA score 95+
40. Probar instalación en Android Chrome y iOS Safari

---

## 10. DEPENDENCIAS NPM

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "idb-keyval": "^6.2.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

**Regla:** no instalar ninguna librería adicional sin aprobación del usuario.

---

## 11. ARCHIVOS DE CONFIGURACIÓN

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/rvr60\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'bible-rvr60' }
          },
          {
            urlPattern: /\/data\/kjv\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'bible-kjv' }
          }
        ]
      }
    })
  ]
})
```

### netlify.toml
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 12. CHECKLIST — ESTADO FINAL

- [x] RVR60 JSON completo (66 libros) en `/public/data/rvr60/`
- [x] KJV JSON completo (66 libros) en `/public/data/kjv/`
- [x] `src/data/books-meta.js` creado y verificado
- [x] Repositorio GitHub: https://github.com/jsilvacode/bible-pwa
- [x] Deploy Netlify: https://santa-biblia.netlify.app
- [x] Deploy automático configurado (push → deploy)
- [x] `netlify.toml` con redirects SPA configurado
- [x] App EGW registrada en cpanel.egwwritings.org
- [x] Variables EGW_CLIENT_ID y EGW_CLIENT_SECRET en Netlify (secretas)
- [x] `.env` local con credenciales EGW
- [x] Nombre de la app: Santa Biblia
- [ ] `/public/data/versions.json` → el agente lo crea en Fase 1
- [ ] `/public/data/books.json` → el agente lo crea en Fase 1
- [ ] Peshitá en español → v1.1
- [ ] Comentarios Matthew Henry / JFB → v1.1

---

## 13. INSTRUCCIONES FINALES PARA EL AGENTE

```
Eres un agente de desarrollo experto en React y PWAs. Tu tarea es construir 
una aplicación de lectura bíblica siguiendo EXACTAMENTE las especificaciones 
de este documento.

REGLAS OBLIGATORIAS:
1. El proyecto ya existe en /Users/zeus/proyectos/bible-pwa/
2. Los datos bíblicos YA ESTÁN GENERADOS en public/data/rvr60/ y public/data/kjv/
   NO los regeneres ni los sobreescribas bajo ninguna circunstancia
3. src/data/books-meta.js YA EXISTE — NO lo regeneres
4. Seguir el orden de fases ESTRICTAMENTE — no saltar pasos
5. Al terminar cada fase, listar los archivos creados/modificados y esperar 
   confirmación del usuario antes de avanzar
6. NO instalar librerías adicionales sin aprobación explícita del usuario
7. CSS en módulos separados por componente — sin estilos inline salvo excepciones
8. Todos los colores y tamaños usando variables CSS de tokens.css — nunca hardcodeados
9. El tema se aplica con data-theme en <html> — nunca con clases de JavaScript
10. Inicializar IndexedDB una sola vez en services/db.js — todos los hooks la importan de ahí

COMENZAR POR:
Fase 1, paso 1: inicializar el proyecto Vite en la carpeta existente.
Antes de escribir código, confirmar que entendiste el schema de datos 
mostrando cómo leerías el archivo /public/data/rvr60/43_juan.json 
para mostrar Juan 3:16.
```

---

*Bible PWA — Documento Maestro v2.0 — Listo para agente*
