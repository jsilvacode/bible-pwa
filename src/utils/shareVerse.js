/**
 * @param {{ title?: string, text: string, url: string }} payload
 * @returns {Promise<'shared' | 'copied' | 'opened' | 'cancelled'>}
 */
export async function shareVerse({ title, text, url }) {
  const body = `${text}\n\n${url}`;

  try {
    if (navigator.share) {
      // Incluir la URL dentro del texto garantiza que cada destino de la hoja
      // de compartir la pegue como enlace y pueda generar su vista previa.
      await navigator.share({ title, text: body });
      return 'shared';
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(body);
      return 'copied';
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(body)}`,
      '_blank',
      'noopener,noreferrer'
    );
    return 'opened';
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
    throw err;
  }
}
