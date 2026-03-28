export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing auth code" }) };
    }

    const tokenUrl = 'https://cpanel.egwwritings.org/connect/token';
    const clientId = process.env.VITE_EGW_CLIENT_ID;
    const clientSecret = process.env.VITE_EGW_CLIENT_SECRET;
    const redirectUri = process.env.VITE_EGW_REDIRECT_URI;

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

    const tokenData = await res.json();
    return {
      statusCode: res.status,
      body: JSON.stringify(tokenData)
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
