import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  InvalidGrantError,
  InvalidRequestError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { createFirebaseOAuthProvider } from "../oauth-provider.js";
import { renderLoginPage } from "../oauth-page.js";

class MemoryFirestore {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    const records = this.collections.get(name);
    return {
      doc: (id = randomUUID()) => ({
        id,
        collectionName: name,
        get: async () => {
          const value = records.get(id);
          return {
            exists: value !== undefined,
            data: () => value,
            ref: this.collection(name).doc(id),
          };
        },
        create: async (value) => {
          if (records.has(id)) throw new Error("Document already exists");
          records.set(id, value);
        },
        delete: async () => records.delete(id),
      }),
      where: (field, _operator, value) => ({
        limit: () => ({
          get: async () => ({
            docs: [...records.entries()]
              .filter(([, data]) => data[field] === value)
              .map(([id, data]) => ({
                data: () => data,
                ref: this.collection(name).doc(id),
              })),
          }),
        }),
      }),
    };
  }

  async runTransaction(work) {
    const transaction = {
      get: async (ref) => {
        const collection = this.collections.get(ref.collectionName);
        const value = collection?.get(ref.id);
        return { exists: value !== undefined, data: () => value };
      },
      create: (ref, value) => {
        const collection = this.collections.get(ref.collectionName);
        if (collection.has(ref.id)) throw new Error("Document already exists");
        collection.set(ref.id, value);
      },
      update: (ref, value) => {
        const collection = this.collections.get(ref.collectionName);
        const current = collection.get(ref.id);
        if (!current) throw new Error("Document does not exist");
        collection.set(ref.id, { ...current, ...value });
      },
      delete: (ref) => this.collections.get(ref.collectionName).delete(ref.id),
    };
    return work(transaction);
  }
}

function providerFixture() {
  const db = new MemoryFirestore();
  let signedInUid = "admin-uid";
  const pages = [];
  const provider = createFirebaseOAuthProvider({
    db,
    admin: { auth: () => ({ verifyIdToken: async () => ({ uid: signedInUid }) }) },
    getAdminUid: () => "admin-uid",
    getFirebaseApiKey: () => "public-firebase-api-key",
    resourceUrl: new URL("https://c-motau-profile.web.app/mcp"),
    completionUrl: "https://c-motau-profile.web.app/authorize/complete",
    renderLoginPage: (page) => {
      pages.push(page);
      return { nonce: "test-nonce", html: "login" };
    },
  });
  return { db, pages, provider, setSignedInUid: (uid) => (signedInUid = uid) };
}

test("OAuth code, refresh rotation, revocation, and admin binding", async () => {
  const { db, pages, provider, setSignedInUid } = providerFixture();
  const client = await provider.clientsStore.registerClient({
    client_id: "chatgpt-test-client",
    client_name: "ChatGPT",
    redirect_uris: ["https://chatgpt.com/oauth/callback"],
    token_endpoint_auth_method: "none",
  });
  const params = {
    state: "random-state",
    scopes: ["profile:admin", "offline_access"],
    codeChallenge: "test-code-challenge",
    redirectUri: client.redirect_uris[0],
    resource: new URL("https://c-motau-profile.web.app/mcp"),
  };
  const response = { setHeader() {}, send() {} };
  await provider.authorize(client, params, response);

  assert.equal(pages.length, 1);
  setSignedInUid("not-admin");
  await assert.rejects(
    provider.issueAuthorizationCode(pages[0].flowId, "firebase-id-token"),
    InvalidRequestError,
  );
  setSignedInUid("admin-uid");
  const callback = new URL(
    await provider.issueAuthorizationCode(pages[0].flowId, "firebase-id-token"),
  );
  assert.equal(callback.searchParams.get("state"), "random-state");
  const code = callback.searchParams.get("code");
  assert.equal(await provider.challengeForAuthorizationCode(client, code), params.codeChallenge);

  const first = await provider.exchangeAuthorizationCode(
    client,
    code,
    undefined,
    params.redirectUri,
    params.resource,
  );
  assert.equal(first.scope, "profile:admin offline_access");
  assert.equal((await provider.verifyAccessToken(first.access_token)).extra.uid, "admin-uid");
  await assert.rejects(
    provider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      params.redirectUri,
      params.resource,
    ),
    InvalidGrantError,
  );

  const second = await provider.exchangeRefreshToken(
    client,
    first.refresh_token,
    undefined,
    params.resource,
  );
  await assert.rejects(provider.verifyAccessToken(first.access_token), InvalidGrantError);
  await assert.rejects(
    provider.exchangeRefreshToken(client, first.refresh_token, undefined, params.resource),
    InvalidGrantError,
  );
  await provider.revokeToken(client, {
    token: second.access_token,
    token_type_hint: "access_token",
  });
  await assert.rejects(provider.verifyAccessToken(second.access_token), InvalidGrantError);
  assert.ok(db.collections.has("chatgptOAuthAccessTokens"));
});

test("only HTTPS redirect URIs and non-admin accounts are rejected", async () => {
  const { provider } = providerFixture();
  await assert.rejects(
    provider.clientsStore.registerClient({
      client_id: "insecure-client",
      redirect_uris: ["http://chatgpt.com/callback"],
      token_endpoint_auth_method: "none",
    }),
    InvalidRequestError,
  );
});

test("OAuth consent page keeps client-controlled values out of executable markup", () => {
  const { html } = renderLoginPage({
    flowId: "flow-id",
    clientName: "</script><script>alert(1)</script>",
    firebaseApiKey: "test-key",
    completionUrl: "https://c-motau-profile.web.app/authorize/complete",
  });
  assert.equal(html.includes("</script><script>alert(1)</script>"), false);
  assert.match(html, /\\u003c\/script\\u003e/);
});
