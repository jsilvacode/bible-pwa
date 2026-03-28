import { useState, useEffect } from 'react';
import { set, del, values } from 'idb-keyval';
import { highlightsStore } from '../services/db';

export function useHighlights(version, book, chapter) {
  const [highlights, setHighlights] = useState({});

  useEffect(() => {
    if (!version || !book || !chapter) return;
    
    values(highlightsStore).then(all => {
      const chapterHighlights = all.filter(h => 
        h.version === version && 
        h.book === Number(book) && 
        h.chapter === Number(chapter)
      );
      
      const map = {};
      chapterHighlights.forEach(h => { map[h.verse] = h.color; });
      setHighlights(map);
    }).catch(console.error);
  }, [version, book, chapter]);

  const setHighlight = async (payload, color) => {
    // payload = { id, version, book, chapter, verse }
    if (!color) {
       await del(payload.id, highlightsStore);
       setHighlights(prev => { 
         const next = {...prev}; 
         delete next[payload.verse]; 
         return next; 
       });
    } else {
       const data = { ...payload, color, createdAt: Date.now() };
       await set(payload.id, data, highlightsStore);
       setHighlights(prev => ({...prev, [payload.verse]: color}));
    }
  };

  return { highlights, setHighlight };
}
