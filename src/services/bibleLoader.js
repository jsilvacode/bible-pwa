let booksCache = null;
const booksByBookCache = {};

export async function fetchBooksManifest() {
  if (booksCache) return booksCache;
  try {
    const res = await fetch('/data/books.json');
    if (!res.ok) throw new Error('Manifest fetch failed');
    booksCache = await res.json();
    return booksCache;
  } catch (err) {
    console.error('Error fetching books manifest:', err);
    throw err;
  }
}

export async function fetchVersionsManifest() {
  try {
    const res = await fetch('/data/versions.json');
    return await res.json();
  } catch (err) {
    console.error('Error fetching versions manifest:', err);
    throw err;
  }
}

export async function loadBibleBook(version, bookId) {
  const cacheKey = `${version}_${bookId}`;
  if (booksByBookCache[cacheKey]) {
    return booksByBookCache[cacheKey];
  }
  
  const books = await fetchBooksManifest();
  const bookMeta = books.find(b => b.id === Number(bookId));
  if (!bookMeta) throw new Error('Libro no encontrado');
  
  const url = `/data/${version}/${bookMeta.file}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error cargando el libro desde ${url}`);
  
  const data = await res.json();
  booksByBookCache[cacheKey] = data;
  return data;
}
