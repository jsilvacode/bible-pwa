import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ChapterView from './components/reader/ChapterView';

// Componentes temporales de página para "Navegación Funcional" en Fase 1 y 2
function Home() { return <div style={{padding: '20px'}}><h2>Inicio</h2><p>Versículo del día y lecturas recientes.</p></div>; }
function Search() { return <div style={{padding: '20px'}}><h2>Búsqueda</h2><p>Buscar en la Biblia.</p></div>; }
function Bookmarks() { return <div style={{padding: '20px'}}><h2>Marcadores</h2><p>Tus notas y marcadores.</p></div>; }
function Settings() { return <div style={{padding: '20px'}}><h2>Ajustes</h2><p>Configuración de la app.</p></div>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="read/:book/:chapter/:verse?" element={<ChapterView />} />
          <Route path="search" element={<Search />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
