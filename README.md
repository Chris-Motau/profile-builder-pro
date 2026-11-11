# Profile Admin MCP — Firebase Cloud Functions backend

This backend adds a private MCP endpoint to the existing `c-motau-profile` Firebase project. It does not change the React application or its public hosting.

This is a ChatGPT remote MCP integration for managing profile data; it is not an OpenAI API endpoint for chat completion requests from the web app.

## Security model

- Firebase Admin SDK runs only inside the Cloud Function; no service-account key is stored in the repository or plugin.
- The endpoint requires the `x-admin-api-key` header and compares it in constant time against a Firebase Secret Manager secret.
- Writes are restricted to the existing profile collections. Profile root documents can be updated by ID (`main` or `extras`) but cannot be created/deleted through this MCP interface.
- Delete requires an explicit `confirmation: "DELETE"` value and should only be called after the user confirms the exact record.
- The function uses the existing Firestore database ID `myprofilewebapp`.

## Deploy

Run these commands from the repository root. The function source is in `functions/`, and `firebase.json` is already configured to deploy it:

```bash
npm install -g firebase-tools
firebase login
firebase use c-motau-profile
cd functions
npm install
cd ..
```

Generate a strong key locally. Keep it private; do not commit it or paste it into source files. For Windows with Node.js installed:

```powershell
node --input-type=commonjs -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set the Firebase Secret Manager secret. Paste the generated value when prompted:

```bash
firebase functions:secrets:set CHATGPT_ADMIN_API_KEY
```

Deploy the function:

```bash
firebase deploy --only functions:chatgptAdminMcp
```

You can run the local Functions and Firestore emulators together with `npm run functions:serve` from the repository root, so emulator writes stay local. The root `npm run build` and `npm run dev` commands continue to target the web app.

Expected endpoint (region is explicitly `us-central1`):

```text
https://us-central1-c-motau-profile.cloudfunctions.net/chatgptAdminMcp
```

After deployment, add the same generated API key to the private ChatGPT plugin's connection credentials as the `x-admin-api-key` custom header. Never add it to `VITE_*` variables, frontend code, GitHub, or the plugin manifest.

## Available MCP tools

- `get_profile`
- `list_documents`
- `get_document`
- `create_document`
- `update_document`
- `delete_document`

Allowed collections: `profile`, `education`, `technicalSkills`, `professionalSkills`, `projects`, `apps`, `experience`.

## Notes

The backend is source-only until deployed to the Firebase project. `firebase.json.example` is a reference configuration; deploy using the existing `firebase.json`. Cloud Functions deployment may require enabling the Cloud Functions, Cloud Build, Artifact Registry, and Secret Manager APIs and having billing enabled on the Firebase project. Review the first deploy prompt before accepting any billing changes.
