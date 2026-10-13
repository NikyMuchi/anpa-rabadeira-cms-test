/**
 * Netlify Function: /callback
 * Completes GitHub OAuth token exchange for Decap CMS.
 * Validates CSRF state parameter and restricts postMessage to verified origin.
 */

exports.handler = async function (event) {
  const query = event.queryStringParameters || {};
  const code = query.code;
  const state = query.state;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const host = event.headers.host || "anpa-rabadeira.netlify.app";
  const protocol = event.headers["x-forwarded-proto"] || "https";
  const siteOrigin = `${protocol}://${host}`;

  // Parse cookie for CSRF state validation
  const cookies = event.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)decap_oauth_state=([^;]+)/);
  const expectedState = match ? match[1] : null;

  const clearCookieHeader = "decap_oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure";

  // Validate state
  if (!state || !expectedState || state !== expectedState) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearCookieHeader,
      },
      body: "<h1>Erro de seguridade (CSRF)</h1><p>O parámetro de estado OAuth non coincide ou caducou. Por favor, inténteo de novo.</p>",
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearCookieHeader,
      },
      body: "<h1>Erro de autenticación</h1><p>Non se recibiu o código de autorización.</p>",
    };
  }

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearCookieHeader,
      },
      body: "<h1>Erro de configuración</h1><p>Credenciais GITHUB_CLIENT_ID ou GITHUB_CLIENT_SECRET non configuradas.</p>",
    };
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearCookieHeader,
        },
        body: "<h1>Erro de autorización</h1><p>Non foi posible obter o token de acceso de GitHub.</p>",
      };
    }

    const token = data.access_token;
    const postMessagePayload = JSON.stringify({
      token: token,
      provider: "github",
    });

    // Explicit allowlist containing only the canonical sandbox, PR #1 and PR #7 Deploy Previews
    const allowedOrigins = [
      "https://anpa-rabadeira-cms-test.netlify.app",
      "https://deploy-preview-1--anpa-rabadeira-cms-test.netlify.app",
      "https://deploy-preview-7--anpa-rabadeira-cms-test.netlify.app",
    ];

    // Send postMessage strictly to the verified origin and opener source
    const html = `<!DOCTYPE html>
<html lang="gl">
<head>
  <meta charset="utf-8">
  <title>Autenticación completada</title>
</head>
<body>
  <p>Autenticación completada. Pechando ventá...</p>
  <script>
    (function () {
      var allowedOrigins = ${JSON.stringify(allowedOrigins)};
      function receiveMessage(e) {
        if (!e || allowedOrigins.indexOf(e.origin) === -1 || e.source !== window.opener) {
          return;
        }
        window.opener.postMessage(
          'authorization:github:success:${postMessagePayload.replace(/'/g, "\\'")}',
          e.origin
        );
        window.removeEventListener("message", receiveMessage, false);
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
      }
    })();
  </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearCookieHeader,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: html,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearCookieHeader,
      },
      body: "<h1>Erro interno</h1><p>Produciuse un erro ao procesar a autenticación.</p>",
    };
  }
};
