function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const handler = async (event) => {
  const query = event.queryStringParameters || {};
  const book = query.book || '';
  const chapter = query.chapter || '';
  const verse = query.verse || '';
  const bookName = query.bookName || `Libro ${book}`;
  const verseText = (query.text || '').slice(0, 220);

  const targetPath = `/read/${encodeURIComponent(book)}/${encodeURIComponent(chapter)}/${encodeURIComponent(verse)}`;
  const canonicalUrl = `https://santa-biblia.netlify.app${targetPath}`;
  const title = `${bookName} ${chapter}:${verse}`;
  const description = verseText || 'Lectural biblica para el estudio devocional';
  const image = 'https://santa-biblia.netlify.app/og-card.png?v=3';

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)} | Santa Biblia</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Santa Biblia" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta http-equiv="refresh" content="0;url=${targetPath}" />
  </head>
  <body>
    <p>Abriendo <a href="${targetPath}">${escapeHtml(title)}</a>...</p>
    <script>window.location.replace(${JSON.stringify(targetPath)});</script>
  </body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    },
    body: html,
  };
};
