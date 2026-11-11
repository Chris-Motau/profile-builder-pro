import { timingSafeEqual } from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const API_KEY = defineSecret('CHATGPT_ADMIN_API_KEY');
const DATABASE_ID = 'myprofilewebapp';
const ALLOWED_COLLECTIONS = new Set([
  'profile', 'education', 'technicalSkills', 'professionalSkills',
  'projects', 'apps', 'experience',
]);
const MAX_DOCUMENT_BYTES = 24 * 1024;

if (getApps().length === 0) initializeApp();
const db = getFirestore(undefined, DATABASE_ID);

function authorized(req) {
  const supplied = req.get('x-admin-api-key') || '';
  const expected = API_KEY.value();
  if (!supplied || !expected) return false;
  const a = Buffer.from(supplied, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function assertCollection(name) {
  if (!ALLOWED_COLLECTIONS.has(name)) {
    throw new Error(`Collection is not allowed: ${name}`);
  }
  return name;
}

function assertDocument(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Document data must be a JSON object.');
  }
  const encoded = JSON.stringify(data);
  if (Buffer.byteLength(encoded, 'utf8') > MAX_DOCUMENT_BYTES) {
    throw new Error('Document is too large. Maximum size is 24 KB.');
  }
  for (const forbidden of ['__proto__', 'prototype', 'constructor']) {
    if (Object.hasOwn(data, forbidden)) throw new Error(`Forbidden property: ${forbidden}`);
  }
  return data;
}

function result(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function createServer() {
  const server = new McpServer({ name: 'profile-admin', version: '1.0.0' });

  server.tool('get_profile', 'Read the main profile and extra contact/social/CV information.', {}, async () => {
    const [main, extras] = await Promise.all([
      db.collection('profile').doc('main').get(),
      db.collection('profile').doc('extras').get(),
    ]);
    return result({ main: main.exists ? main.data() : null, extras: extras.exists ? extras.data() : null });
  });

  server.tool('list_documents', 'List records from an allowed profile collection. Use a small limit; results are ordered by createdAt when available.', {
    collection: z.enum(['education', 'technicalSkills', 'professionalSkills', 'projects', 'apps', 'experience']),
    limit: z.number().int().min(1).max(50).default(20),
  }, async ({ collection, limit }) => {
    const snap = await db.collection(assertCollection(collection)).limit(limit).get();
    return result(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });

  server.tool('get_document', 'Read one document from an allowed profile collection.', {
    collection: z.enum(['profile', 'education', 'technicalSkills', 'professionalSkills', 'projects', 'apps', 'experience']),
    id: z.string().min(1).max(150),
  }, async ({ collection, id }) => {
    const snap = await db.collection(assertCollection(collection)).doc(id).get();
    return result(snap.exists ? { id: snap.id, ...snap.data() } : { found: false, id });
  });

  server.tool('create_document', 'Create a new profile record in an allowed collection.', {
    collection: z.enum(['education', 'technicalSkills', 'professionalSkills', 'projects', 'apps', 'experience']),
    data: z.record(z.string(), z.unknown()),
  }, async ({ collection, data }) => {
    const clean = assertDocument(data);
    const ref = await db.collection(assertCollection(collection)).add({ ...clean, createdAt: Date.now(), updatedAt: Date.now() });
    return result({ created: true, collection, id: ref.id });
  });

  server.tool('update_document', 'Update fields on an existing profile document. Existing fields not supplied are preserved.', {
    collection: z.enum(['profile', 'education', 'technicalSkills', 'professionalSkills', 'projects', 'apps', 'experience']),
    id: z.string().min(1).max(150),
    data: z.record(z.string(), z.unknown()),
  }, async ({ collection, id, data }) => {
    const clean = assertDocument(data);
    const ref = db.collection(assertCollection(collection)).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Document not found: ${collection}/${id}`);
    await ref.set({ ...clean, updatedAt: Date.now() }, { merge: true });
    return result({ updated: true, collection, id });
  });

  server.tool('delete_document', 'Permanently delete one profile record. Only call after the user explicitly confirms the exact record deletion; confirmation must be the literal DELETE.', {
    collection: z.enum(['education', 'technicalSkills', 'professionalSkills', 'projects', 'apps', 'experience']),
    id: z.string().min(1).max(150),
    confirmation: z.literal('DELETE'),
  }, async ({ collection, id }) => {
    const ref = db.collection(assertCollection(collection)).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Document not found: ${collection}/${id}`);
    await ref.delete();
    return result({ deleted: true, collection, id });
  });

  return server;
}

export const chatgptAdminMcp = onRequest({
  region: 'us-central1',
  secrets: [API_KEY],
  timeoutSeconds: 60,
  memory: '256MiB',
  cors: false,
}, async (req, res) => {
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    res.set('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
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
    console.error('Profile Admin MCP request failed', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
});
