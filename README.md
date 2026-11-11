# Profile Admin MCP — Firebase Cloud Functions backend

This backend adds a private ChatGPT MCP connection for managing profile data in the existing `c-motau-profile` Firebase project. It is not an OpenAI chat-completions API for the website.

## Authentication and security

- ChatGPT connects with OAuth 2.1 authorization code flow and PKCE. The OAuth authorization server, metadata, callback, and MCP routes are exposed through Firebase Hosting at `https://c-motau-profile.web.app`.
- Admin sign-in uses the existing Firebase Authentication email/password account. The OAuth service verifies the Firebase ID token and only grants access to the configured admin UID.
- Access and refresh tokens are stored in the `myprofilewebapp` Firestore database. Access tokens expire after 15 minutes; refresh tokens rotate and expire after 30 days.
- The consent page explicitly tells the admin that ChatGPT can read, create, update, and delete profile records.
- Writes are limited to the existing profile collections. Profile root documents can be updated by ID (`main` or `extras`) but cannot be created or deleted through MCP.
- Delete requires `confirmation: "DELETE"` and should only be called after the user confirms the exact record.

Never choose “No authentication” for this MCP server. It can modify live profile data.

## Deploy

The Firebase Functions source is in `functions/`; `firebase.json` configures the Functions and Hosting rewrites. From the repository root:

```powershell
firebase.cmd login
firebase.cmd use c-motau-profile
```

Set the two Firebase Secret Manager values. Use the same Firebase Web API key as `VITE_FIREBASE_API_KEY` and the same admin UID configured in `VITE_FIREBASE_ADMIN_UID`. Enter each value at the prompt:

```powershell
firebase.cmd functions:secrets:set MCP_OAUTH_FIREBASE_WEB_API_KEY
firebase.cmd functions:secrets:set MCP_OAUTH_FIREBASE_ADMIN_UID
```

Deploy both Cloud Functions and the Hosting rewrites:

```powershell
npm.cmd run functions:deploy
```

The Hosting rewrite keeps the existing site fallback while routing `/mcp`, OAuth endpoints, and OAuth discovery metadata to the appropriate functions.

## Connect ChatGPT

In ChatGPT's custom MCP server setup:

1. Choose **OAuth** authentication.
2. Set the MCP server URL to `https://c-motau-profile.web.app/mcp`.
3. Continue through OAuth discovery and sign in with the Firebase admin account.
4. Review the access warning and approve only if you initiated the connection.

Do not configure the obsolete `x-admin-api-key` header. The deployed MCP endpoint now requires an OAuth bearer token.

## Available MCP tools

- `get_profile`
- `list_documents`
- `get_document`
- `create_document`
- `update_document`
- `delete_document`

Allowed collections: `profile`, `education`, `technicalSkills`, `professionalSkills`, `projects`, `apps`, `experience`.

## Local development and deployment notes

`npm run dev` and `npm run build` continue to target the website. `npm run functions:serve` starts the Functions and Firestore emulators; the ChatGPT OAuth setup uses the deployed Hosting domain and is verified against the deployed endpoints.

Cloud Functions deployment may require enabling Cloud Functions, Cloud Build, Artifact Registry, Secret Manager, and related APIs, as well as billing on the Firebase project. Review any billing prompts before accepting them.
