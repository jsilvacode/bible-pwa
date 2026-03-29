export const handler = async () => {
  const clientId = process.env.EGW_CLIENT_ID;
  const redirectUri = process.env.EGW_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'EGW OAuth config not available' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Cache-Control': 'no-store' },
    body: JSON.stringify({
      clientId,
      redirectUri
    })
  };
};
