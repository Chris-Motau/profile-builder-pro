import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import {
  createOAuthMetadata,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { createFirebaseOAuthProvider } from "./oauth-provider.js";
import { renderLoginPage } from "./oauth-page.js";

const FIREBASE_WEB_API_KEY = defineSecret("MCP_OAUTH_FIREBASE_WEB_API_KEY");
export const FIREBASE_ADMIN_UID = defineSecret("MCP_OAUTH_FIREBASE_ADMIN_UID");
const DATABASE_ID = "myprofilewebapp";
const SITE_ORIGIN = new URL("https://c-motau-profile.web.app");
const MCP_RESOURCE = new URL("/mcp", SITE_ORIGIN);
const AUTHORIZE_COMPLETION = new URL("/authorize/complete", SITE_ORIGIN).href;
const ADMIN_SCOPE = "profile:admin";
if (getApps().length === 0) initializeApp();
const db = getFirestore(undefined, DATABASE_ID);

const app = express();
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json({ limit: "16kb" }));

const provider = createFirebaseOAuthProvider({
  db,
  admin: { auth: getAuth },
  getAdminUid: () => FIREBASE_ADMIN_UID.value(),
  getFirebaseApiKey: () => FIREBASE_WEB_API_KEY.value(),
  resourceUrl: MCP_RESOURCE,
  completionUrl: AUTHORIZE_COMPLETION,
  renderLoginPage,
});

const oauthMetadata = createOAuthMetadata({
  provider,
  issuerUrl: SITE_ORIGIN,
  scopesSupported: [ADMIN_SCOPE],
});
oauthMetadata.revocation_endpoint_auth_methods_supported = ["none"];

app.get("/.well-known/oauth-authorization-server", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(oauthMetadata);
});
app.get("/.well-known/oauth-protected-resource/mcp", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    resource: MCP_RESOURCE.href,
    authorization_servers: [SITE_ORIGIN.href],
    scopes_supported: [ADMIN_SCOPE],
    resource_name: "Profile Admin MCP",
    resource_documentation: SITE_ORIGIN.href,
  });
});

app.post("/authorize/complete", async (req, res) => {
  try {
    const redirect = await provider.issueAuthorizationCode(req.body?.flowId, req.body?.idToken);
    res.setHeader("Cache-Control", "no-store");
    res.json({ redirect });
  } catch (error) {
    console.error("OAuth authorization completion failed", error);
    res.status(401).json({
      error: "Authentication failed. Sign in with the configured admin account and try again.",
    });
  }
});

app.use(
  mcpAuthRouter({
    provider,
    issuerUrl: SITE_ORIGIN,
    resourceServerUrl: MCP_RESOURCE,
    resourceName: "Profile Admin MCP",
    scopesSupported: [ADMIN_SCOPE],
    serviceDocumentationUrl: SITE_ORIGIN,
  }),
);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export const profileAdminOAuth = onRequest(
  {
    region: "us-central1",
    secrets: [FIREBASE_WEB_API_KEY, FIREBASE_ADMIN_UID],
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 5,
  },
  app,
);

export async function verifyMcpAccessToken(token) {
  return provider.verifyAccessToken(token);
}
