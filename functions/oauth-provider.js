import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  InvalidGrantError,
  InvalidRequestError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";

const FLOW_TTL_MS = 10 * 60 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_SCOPE = "profile:admin";

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken() {
  return randomBytes(32).toString("base64url");
}

function safeClient(client) {
  const uriSet = new Set(client.redirect_uris);
  if (
    uriSet.size !== client.redirect_uris.length ||
    client.redirect_uris.length < 1 ||
    client.redirect_uris.length > 10 ||
    client.redirect_uris.some((redirectUri) => {
      try {
        const parsed = new URL(redirectUri);
        return (
          parsed.protocol !== "https:" ||
          parsed.username.length > 0 ||
          parsed.password.length > 0 ||
          parsed.hash.length > 0
        );
      } catch {
        return true;
      }
    })
  ) {
    throw new InvalidRequestError("Only unique HTTPS redirect URIs are supported.");
  }
  if (
    (client.token_endpoint_auth_method && client.token_endpoint_auth_method !== "none") ||
    (client.grant_types && client.grant_types.some((grant) => grant !== "authorization_code")) ||
    (client.response_types && client.response_types.some((type) => type !== "code"))
  ) {
    throw new InvalidRequestError("Only public authorization-code clients are supported.");
  }
}

export function createFirebaseOAuthProvider({
  db,
  admin,
  getAdminUid,
  getFirebaseApiKey,
  resourceUrl,
  completionUrl,
  renderLoginPage,
}) {
  const clients = db.collection("chatgptOAuthClients");
  const flows = db.collection("chatgptOAuthFlows");
  const codes = db.collection("chatgptOAuthCodes");
  const accessTokens = db.collection("chatgptOAuthAccessTokens");
  const refreshTokens = db.collection("chatgptOAuthRefreshTokens");
  const resource = resourceUrl.href;

  function newAccessToken() {
    const value = randomToken();
    return {
      value,
      ref: accessTokens.doc(hash(value)),
      expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    };
  }

  function newRefreshToken() {
    const value = randomToken();
    return {
      value,
      ref: refreshTokens.doc(hash(value)),
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS,
    };
  }

  async function saveTokenPair(transaction, { clientId, scopes, uid, previousRefreshRef }) {
    const access = newAccessToken();
    const refresh = newRefreshToken();
    const now = Date.now();

    if (previousRefreshRef) {
      transaction.update(previousRefreshRef, { revokedAt: now });
    }
    transaction.create(access.ref, {
      tokenHash: hash(access.value),
      clientId,
      scopes,
      uid,
      resource,
      createdAt: now,
      expiresAt: access.expiresAt,
    });
    transaction.create(refresh.ref, {
      tokenHash: hash(refresh.value),
      accessTokenId: access.ref.id,
      clientId,
      scopes,
      uid,
      resource,
      createdAt: now,
      expiresAt: refresh.expiresAt,
    });

    return {
      access_token: access.value,
      token_type: "Bearer",
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      refresh_token: refresh.value,
      scope: scopes.join(" "),
    };
  }

  return {
    clientsStore: {
      async getClient(clientId) {
        const snapshot = await clients.doc(clientId).get();
        return snapshot.exists ? snapshot.data() : undefined;
      },
      async registerClient(client) {
        safeClient(client);
        if (client.token_endpoint_auth_method !== "none") {
          throw new InvalidRequestError(
            "Only public clients using token_endpoint_auth_method=none are supported.",
          );
        }
        if (!client.client_id || client.client_secret) {
          throw new InvalidRequestError("Invalid public client registration.");
        }
        const stored = {
          ...client,
          grant_types: ["authorization_code"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
        };
        await clients.doc(client.client_id).create(stored);
        return stored;
      },
    },

    async authorize(client, params, res) {
      if (params.resource?.href !== resource) {
        throw new InvalidRequestError("The OAuth resource must identify this MCP server.");
      }
      const scopes = params.scopes?.length ? params.scopes : [ADMIN_SCOPE];
      if (scopes.length !== 1 || scopes[0] !== ADMIN_SCOPE) {
        throw new InvalidRequestError("Unsupported OAuth scope.");
      }

      const flowId = randomUUID();
      await flows.doc(flowId).create({
        clientId: client.client_id,
        clientName: client.client_name || "ChatGPT",
        redirectUri: params.redirectUri,
        state: params.state || null,
        codeChallenge: params.codeChallenge,
        scopes,
        resource,
        createdAt: Date.now(),
        expiresAt: Date.now() + FLOW_TTL_MS,
      });

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const { nonce, html } = renderLoginPage({
        flowId,
        clientName: client.client_name || "ChatGPT",
        firebaseApiKey: getFirebaseApiKey(),
        completionUrl,
      });
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self' https://identitytoolkit.googleapis.com; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`,
      );
      res.send(html);
    },

    async issueAuthorizationCode(flowId, idToken) {
      if (
        typeof flowId !== "string" ||
        flowId.length > 100 ||
        typeof idToken !== "string" ||
        idToken.length > 8192
      ) {
        throw new InvalidRequestError("Invalid authorization request.");
      }

      const decoded = await admin.auth().verifyIdToken(idToken, true);
      if (decoded.uid !== getAdminUid()) {
        throw new InvalidRequestError("This Firebase account is not authorized to connect.");
      }

      const flowRef = flows.doc(flowId);
      const code = randomToken();
      const codeRef = codes.doc(hash(code));
      let flow;
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(flowRef);
        if (!snapshot.exists)
          throw new InvalidRequestError("Authorization request expired. Start again.");
        flow = snapshot.data();
        if (flow.expiresAt <= Date.now()) {
          transaction.delete(flowRef);
          throw new InvalidRequestError("Authorization request expired. Start again.");
        }
        transaction.delete(flowRef);
        transaction.create(codeRef, {
          clientId: flow.clientId,
          uid: decoded.uid,
          redirectUri: flow.redirectUri,
          codeChallenge: flow.codeChallenge,
          scopes: flow.scopes,
          resource: flow.resource,
          createdAt: Date.now(),
          expiresAt: Date.now() + CODE_TTL_MS,
        });
      });

      const callback = new URL(flow.redirectUri);
      callback.searchParams.set("code", code);
      if (flow.state !== null) callback.searchParams.set("state", flow.state);
      return callback.href;
    },

    async challengeForAuthorizationCode(client, authorizationCode) {
      const snapshot = await codes.doc(hash(authorizationCode)).get();
      const code = snapshot.exists ? snapshot.data() : undefined;
      if (
        !code ||
        code.clientId !== client.client_id ||
        code.expiresAt <= Date.now() ||
        code.resource !== resource
      ) {
        throw new InvalidGrantError("Invalid or expired authorization code.");
      }
      return code.codeChallenge;
    },

    async exchangeAuthorizationCode(
      client,
      authorizationCode,
      _codeVerifier,
      redirectUri,
      requestedResource,
    ) {
      const codeRef = codes.doc(hash(authorizationCode));
      let tokenResponse;
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(codeRef);
        if (!snapshot.exists) throw new InvalidGrantError("Invalid or expired authorization code.");
        const code = snapshot.data();
        if (
          code.clientId !== client.client_id ||
          code.expiresAt <= Date.now() ||
          code.resource !== resource ||
          requestedResource?.href !== code.resource ||
          redirectUri !== code.redirectUri
        ) {
          throw new InvalidGrantError("Invalid authorization code request.");
        }
        transaction.delete(codeRef);
        tokenResponse = await saveTokenPair(transaction, {
          clientId: code.clientId,
          scopes: code.scopes,
          uid: code.uid,
        });
      });
      return tokenResponse;
    },

    async exchangeRefreshToken(client, refreshToken, requestedScopes, requestedResource) {
      const refreshRef = refreshTokens.doc(hash(refreshToken));
      const response = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(refreshRef);
        if (!snapshot.exists) throw new InvalidGrantError("Invalid refresh token.");
        const refresh = snapshot.data();
        if (
          refresh.clientId !== client.client_id ||
          refresh.revokedAt ||
          refresh.expiresAt <= Date.now() ||
          refresh.resource !== resource ||
          requestedResource?.href !== refresh.resource ||
          (requestedScopes && requestedScopes.some((scope) => !refresh.scopes.includes(scope)))
        ) {
          throw new InvalidGrantError("Invalid refresh token.");
        }
        const previousAccessRef = accessTokens.doc(refresh.accessTokenId);
        const previousAccess = await transaction.get(previousAccessRef);
        if (previousAccess.exists) {
          transaction.update(previousAccessRef, { revokedAt: Date.now() });
        }
        return saveTokenPair(transaction, {
          clientId: refresh.clientId,
          scopes: requestedScopes?.length ? requestedScopes : refresh.scopes,
          uid: refresh.uid,
          previousRefreshRef: refreshRef,
        });
      });
      return response;
    },

    async verifyAccessToken(token) {
      const snapshot = await accessTokens.doc(hash(token)).get();
      const data = snapshot.exists ? snapshot.data() : undefined;
      if (
        !data ||
        data.expiresAt <= Date.now() ||
        data.revokedAt ||
        data.resource !== resource ||
        data.uid !== getAdminUid() ||
        !data.scopes.includes(ADMIN_SCOPE)
      ) {
        throw new InvalidGrantError("Invalid or expired access token.");
      }
      return {
        token,
        clientId: data.clientId,
        scopes: data.scopes,
        expiresAt: Math.floor(data.expiresAt / 1000),
        resource: new URL(data.resource),
        extra: { uid: data.uid },
      };
    },

    async revokeToken(client, request) {
      const collections =
        request.token_type_hint === "refresh_token"
          ? [refreshTokens]
          : request.token_type_hint === "access_token"
            ? [accessTokens]
            : [accessTokens, refreshTokens];
      for (const collection of collections) {
        const tokenRef = collection.doc(hash(request.token));
        await db.runTransaction(async (transaction) => {
          const current = await transaction.get(tokenRef);
          if (!current.exists || current.data().clientId !== client.client_id) return;
          let accessRef;
          let accessSnapshot;
          if (collection === refreshTokens && current.data().accessTokenId) {
            accessRef = accessTokens.doc(current.data().accessTokenId);
            accessSnapshot = await transaction.get(accessRef);
          }
          transaction.update(tokenRef, { revokedAt: Date.now() });
          if (accessRef && accessSnapshot?.exists) {
            transaction.update(accessRef, { revokedAt: Date.now() });
          }
        });
        return;
      }
    },
  };
}
