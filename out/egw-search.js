(() => {
  // netlify/functions/egw-search.js
  var handler = async (event) => {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
      const token = typeof body.token === "string" ? body.token : "";
      if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: "Missing access token" }) };
      }
      if (!endpoint.startsWith("/search/")) {
        return { statusCode: 400, body: JSON.stringify({ error: "Unsupported endpoint" }) };
      }
      const baseUrl = "https://a.egwwritings.org";
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          statusCode: response.status,
          body: JSON.stringify({
            error: data?.error || data?.message || "EGW search failed"
          })
        };
      }
      return {
        statusCode: 200,
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify(data)
      };
    } catch (e) {
      console.error("Error in egw-search function", e);
      return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
    }
  };
})();
