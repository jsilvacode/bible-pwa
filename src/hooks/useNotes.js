import { useState, useEffect } from 'react';
import { get, set, del, values } from 'idb-keyval';
import { notesStore } from '../services/db';

export function useNotes(id) {
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (id) {
      get(id, notesStore).then(setNote).catch(console.error);
    }
  }, [id]);

  const saveNote = async (payload) => {
    const data = { ...payload, updatedAt: Date.now() };
    await set(payload.id, data, notesStore);
    setNote(data);
  };

  const deleteNote = async (deleteId) => {
    await del(deleteId, notesStore);
    if (deleteId === id) setNote(null);
  };

  return { note, saveNote, deleteNote };
}

export async function getAllNotes() {
  try {
    const list = await values(notesStore);
    return list.sort((a,b) => b.updatedAt - a.updatedAt);
  } catch(e) {
    console.error(e);
    return [];
  }
}
