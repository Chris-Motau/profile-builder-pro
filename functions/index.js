import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { InvalidGrantError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { FIREBASE_ADMIN_UID, verifyMcpAccessToken } from "./oauth-server.js";

export { profileAdminOAuth } from "./oauth-server.js";

const DATABASE_ID = "myprofilewebapp";
const MCP_RESOURCE = new URL("https://c-motau-profile.web.app/mcp");
const RESOURCE_METADATA_URL = getOAuthProtectedResourceMetadataUrl(MCP_RESOURCE);
const ADMIN_SCOPE = "profile:admin";
const ALLOWED_COLLECTIONS = new Set([
  "profile",
  "education",
  "technicalSkills",
  "professionalSkills",
  "projects",
  "apps",
  "experience",
]);
const MAX_DOCUMENT_BYTES = 24 * 1024;

if (getApps().length === 0) initializeApp();
const db = getFirestore(undefined, DATABASE_ID);

function assertCollection(name) {
  if (!ALLOWED_COLLECTIONS.has(name)) {
    throw new Error(`Collection is not allowed: ${name}`);
  }
  return name;
}

function assertDocument(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Document data must be a JSON object.");
  }
  const encoded = JSON.stringify(data);
  if (Buffer.byteLength(encoded, "utf8") > MAX_DOCUMENT_BYTES) {
    throw new Error("Document is too large. Maximum size is 24 KB.");
  }
  for (const forbidden of ["__proto__", "prototype", "constructor"]) {
    if (Object.hasOwn(data, forbidden)) throw new Error(`Forbidden property: ${forbidden}`);
  }
  return data;
}

function result(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function createServer() {
  const server = new McpServer({ name: "profile-admin", version: "1.0.0" });

  server.tool(
    "get_profile",
    "Read the main profile and extra contact/social/CV information.",
    {},
    async () => {
      const [main, extras] = await Promise.all([
        db.collection("profile").doc("main").get(),
        db.collection("profile").doc("extras").get(),
      ]);
      return result({
        main: main.exists ? main.data() : null,
        extras: extras.exists ? extras.data() : null,
      });
    },
  );

  server.tool(
    "list_documents",
    "List records from an allowed profile collection. Results are not ordered; use a small limit.",
    {
      collection: z.enum([
        "education",
        "technicalSkills",
        "professionalSkills",
        "projects",
        "apps",
        "experience",
      ]),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async ({ collection, limit }) => {
      const snap = await db.collection(assertCollection(collection)).limit(limit).get();
      return result(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
  );

  server.tool(
    "get_document",
    "Read one document from an allowed profile collection.",
    {
      collection: z.enum([
        "profile",
        "education",
        "technicalSkills",
        "professionalSkills",
        "projects",
        "apps",
        "experience",
      ]),
      id: z.string().min(1).max(150),
    },
    async ({ collection, id }) => {
      const snap = await db.collection(assertCollection(collection)).doc(id).get();
      return result(snap.exists ? { id: snap.id, ...snap.data() } : { found: false, id });
    },
  );

  server.tool(
    "create_document",
    "Create a new profile record in an allowed collection.",
    {
      collection: z.enum([
        "education",
        "technicalSkills",
        "professionalSkills",
        "projects",
        "apps",
        "experience",
      ]),
      data: z.record(z.string(), z.unknown()),
    },
    async ({ collection, data }) => {
      const clean = assertDocument(data);
      const ref = await db
        .collection(assertCollection(collection))
        .add({ ...clean, createdAt: Date.now(), updatedAt: Date.now() });
      return result({ created: true, collection, id: ref.id });
    },
  );

  server.tool(
    "update_document",
    "Update fields on an existing profile document. Existing fields not supplied are preserved.",
    {
      collection: z.enum([
        "profile",
        "education",
        "technicalSkills",
        "professionalSkills",
        "projects",
        "apps",
        "experience",
      ]),
      id: z.string().min(1).max(150),
      data: z.record(z.string(), z.unknown()),
    },
    async ({ collection, id, data }) => {
      const clean = assertDocument(data);
      const ref = db.collection(assertCollection(collection)).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error(`Document not found: ${collection}/${id}`);
      await ref.set({ ...clean, updatedAt: Date.now() }, { merge: true });
      return result({ updated: true, collection, id });
    },
  );

  server.tool(
    "delete_document",
    "Permanently delete one profile record. Only call after the user explicitly confirms the exact record deletion; confirmation must be the literal DELETE.",
    {
      collection: z.enum([
        "education",
        "technicalSkills",
        "professionalSkills",
        "projects",
        "apps",
        "experience",
      ]),
      id: z.string().min(1).max(150),
      confirmation: z.literal("DELETE"),
    },
    async ({ collection, id }) => {
      const ref = db.collection(assertCollection(collection)).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error(`Document not found: ${collection}/${id}`);
      await ref.delete();
      return result({ deleted: true, collection, id });
    },
  );

  return server;
}

export const chatgptAdminMcp = onRequest(
  {
    region: "us-central1",
    secrets: [FIREBASE_ADMIN_UID],
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: false,
  },
  async (req, res) => {
    const bearer = /^Bearer\s+([^\s]+)$/i.exec(req.get("authorization") || "");
    if (!bearer) {
      res.set(
        "WWW-Authenticate",
        `Bearer resource_metadata="${RESOURCE_METADATA_URL}", scope="${ADMIN_SCOPE}"`,
      );
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    let authInfo;
    try {
      authInfo = await verifyMcpAccessToken(bearer[1]);
    } catch (error) {
      if (!(error instanceof InvalidGrantError)) {
        console.error("OAuth access-token verification failed", error);
        res.status(500).json({ error: "Authentication service unavailable" });
        return;
      }
      res.set(
        "WWW-Authenticate",
        `Bearer resource_metadata="${RESOURCE_METADATA_URL}", scope="${ADMIN_SCOPE}"`,
      );
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!authInfo.scopes.includes(ADMIN_SCOPE) || authInfo.resource?.href !== MCP_RESOURCE.href) {
      res.set(
        "WWW-Authenticate",
        `Bearer resource_metadata="${RESOURCE_METADATA_URL}", scope="${ADMIN_SCOPE}"`,
      );
      res.status(403).json({ error: "Insufficient scope" });
      return;
    }
    if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
      res.set("Allow", "GET, POST, DELETE");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Profile Admin MCP request failed", error);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    } finally {
      await transport.close().catch(() => {});
      await server.close().catch(() => {});
    }
  },
);
