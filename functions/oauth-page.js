import { randomBytes } from "node:crypto";

function safeJson(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const escapes = {
      "<": "\\u003c",
      ">": "\\u003e",
      "&": "\\u0026",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
    };
    return escapes[character];
  });
}

export function renderLoginPage({ flowId, clientName, firebaseApiKey, completionUrl }) {
  const nonce = randomBytes(18).toString("base64");
  const config = safeJson({ flowId, clientName, firebaseApiKey, completionUrl });
  const script = `
    const config = JSON.parse(document.getElementById("oauth-config").textContent);
    const form = document.getElementById("sign-in");
    const status = document.getElementById("status");
    const account = document.getElementById("account");
    const approve = document.getElementById("approve");
    let idToken;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Signing in…";
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        const response = await fetch(
          "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(config.firebaseApiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: document.getElementById("email").value,
              password: document.getElementById("password").value,
              returnSecureToken: true
            })
          }
        );
        if (!response.ok) throw new Error("Sign-in failed. Check your email and password.");
        const result = await response.json();
        idToken = result.idToken;
        account.textContent = result.email || "Signed in";
        account.hidden = false;
        approve.disabled = false;
        form.hidden = true;
        status.textContent = "";
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Sign-in failed.";
        button.disabled = false;
      }
    });

    approve.addEventListener("click", async () => {
      approve.disabled = true;
      status.textContent = "Authorizing…";
      try {
        const response = await fetch(config.completionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId: config.flowId, idToken })
        });
        const result = await response.json();
        if (!response.ok || typeof result.redirect !== "string") {
          throw new Error(result.error || "Could not authorize this connection.");
        }
        window.location.assign(result.redirect);
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Could not authorize this connection.";
        approve.disabled = false;
      }
    });
  `;
  const escapedScript = script.replace(/<\/script/gi, "<\\/script");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connect ChatGPT to your profile</title>
  <style>
    body{font:16px system-ui,sans-serif;max-width:28rem;margin:10vh auto;padding:0 1rem;color:#171717}
    main{border:1px solid #ddd;border-radius:12px;padding:1.5rem}
    label{display:block;margin:.9rem 0 .3rem}
    input{box-sizing:border-box;width:100%;padding:.7rem;border:1px solid #aaa;border-radius:6px}
    button{margin-top:1rem;padding:.7rem 1rem;border:0;border-radius:6px;background:#171717;color:white;cursor:pointer}
    button:disabled{opacity:.55;cursor:wait}
    #status{min-height:1.5rem;color:#a11}
  </style>
</head>
<body>
  <main>
    <h1>Connect ChatGPT</h1>
    <p><strong id="client-name"></strong> is requesting access to your profile.</p>
    <p>Access includes reading, creating, updating, and deleting profile records. Only approve if you initiated this connection.</p>
    <form id="sign-in">
      <label for="email">Firebase admin email</label>
      <input id="email" name="email" type="email" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Sign in</button>
    </form>
    <p id="account" hidden></p>
    <button id="approve" type="button" disabled>Approve profile access</button>
    <p id="status" role="status" aria-live="polite"></p>
  </main>
  <script id="oauth-config" type="application/json">${config}</script>
  <script nonce="${nonce}">${escapedScript}</script>
  <script nonce="${nonce}">document.getElementById("client-name").textContent = JSON.parse(document.getElementById("oauth-config").textContent).clientName;</script>
</body>
</html>`;
  return {
    nonce,
    html,
  };
}
