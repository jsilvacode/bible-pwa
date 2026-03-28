import React, { useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useSettings } from '../../hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import classes from './SearchView.module.css';

export default function SearchView() {
  const { settings } = useSettings();
  const { search, results, loading } = useSearch(settings.version);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className={classes.container}>
      <h2>Buscar en la Biblia</h2>
      <form onSubmit={handleSearch} className={classes.searchForm}>
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Escribe al menos 3 letras..."
          className={classes.input}
        />
        <button type="submit" disabled={loading || query.length < 3} className={classes.button}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className={classes.resultsArea}>
        {loading && <p className={classes.status}>Cargando resultados de 66 libros, por favor espera...</p>}
        {!loading && results.length > 0 && (
          <p className={classes.status}>Se encontraron {results.length} coincidencias</p>
        )}
        {!loading && results.length === 0 && query.length >= 3 && (
          <p className={classes.status}>Cero resultados para tu búsqueda.</p>
        )}

        <div className={classes.list}>
          {results.map(r => (
            <div 
              key={r.id} 
              className={classes.resultItem}
              onClick={() => navigate(`/read/${r.book}/${r.chapter}/${r.verse}`)}
            >
              <div className={classes.ref}>
                {r.bookName} {r.chapter}:{r.verse}
              </div>
              <div className={classes.snippet}>
                {r.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
