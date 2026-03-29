export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { code } = body;
    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing auth code" }) };
    }

    const clientId = process.env.EGW_CLIENT_ID;
    const clientSecret = process.env.EGW_CLIENT_SECRET;
    const redirectUri = process.env.EGW_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      return { statusCode: 500, body: JSON.stringify({ error: "OAuth configuration is incomplete" }) };
    }

    const tokenUrl = 'https://cpanel.egwwritings.org/connect/token';

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString()
    });

    const tokenData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({
          error: tokenData?.error_description || tokenData?.error || "OAuth token exchange failed"
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify(tokenData),
    };
  } catch(e) {
    console.error('Error in egw-token function', e);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
