# NEXORA AI

One AI. Every Task.

NEXORA AI is a Next.js workspace for AI chat, writing, PDF uploads, study tools, conversation history, and account-level usage tracking.

## Requirements

- Node.js 20.9 or newer
- npm
- A Firebase project for authentication, Firestore, and file storage
- An OpenAI-compatible AI API key for generated responses

## Install and run

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.local.example .env.local
```

Open `http://localhost:3000` after the development server starts.

## Firebase setup

1. Create a Firebase project and register a Web App.
2. In Authentication, enable Email/Password and Google providers. Add your local and production hostnames to the authorized domains.
3. Create a Cloud Firestore database.
4. Create a Firebase Storage bucket for PDF uploads.
5. Copy the web app configuration into the matching `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`.
6. Create a service account for the server. Put its JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` as a single-line JSON value. Never commit this credential. On supported Google Cloud deployments, Application Default Credentials can be used instead.
7. Set `FIREBASE_STORAGE_BUCKET` to the bucket name if it is not present in the Firebase web app configuration.
8. Deploy the ownership rules from this repository with Firebase CLI:

```bash
npm install --global firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

The app writes account profile records at `users/{userId}`, chat records at `conversations/{conversationId}` with messages in its `messages` subcollection, and owner-scoped `files`, `history`, and `usage/{userId}` records. Browser writes are restricted by `firestore.rules`; server API routes verify Firebase ID tokens using the Admin SDK. Usage records can only be written by the server.

## Environment variables

| Variable | Where used | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser | Firebase Web App config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser | Firebase Web App config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser and server | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser | Firebase Web App config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser | Firebase Web App config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser | Firebase Web App config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server only | Firebase Admin service account JSON |
| `FIREBASE_STORAGE_BUCKET` | Server only | Bucket name for uploads and deletion |
| `AI_API_KEY` | Server only | Secret key for the AI provider |
| `AI_BASE_URL` | Server only | OpenAI-compatible API base URL; defaults to `https://api.openai.com/v1` |
| `AI_MODEL` | Server only | Provider model; defaults to `gpt-4o-mini` |
| `PDF_TEXT_EXTRACTION_URL` | Server only, optional | Multipart PDF extraction endpoint returning `{ "text": "..." }` |
| `PDF_TEXT_EXTRACTION_API_KEY` | Server only, optional | Bearer token for the PDF extraction endpoint |

Only Firebase Web App values use `NEXT_PUBLIC_`. AI and service-account credentials must never be exposed to browser code.

## AI provider

`lib/ai.ts` owns the provider boundary. The current adapter sends chat-completions requests to an OpenAI-compatible endpoint using `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`. Add provider-specific adapters there rather than calling a provider from React components. Without `AI_API_KEY`, API routes return a configuration error and do not fabricate an answer.

## PDF processing

PDF uploads are authenticated, limited to 20 MB, and stored under a user-specific Storage path. Metadata is stored in Firestore. Analysis requires a server-side extraction endpoint configured in `PDF_TEXT_EXTRACTION_URL`; the endpoint receives multipart field `file` and must return JSON with a `text` string. When it is not configured, analyze requests return an explicit setup error. This avoids presenting an unprocessed file as an AI result.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

The UI and route structure can be built without credentials. Authentication, private Firestore access, uploads, and AI generation require their corresponding Firebase/provider configuration.

## Deployment

Deploy the app to a Node-capable host such as Vercel or Firebase App Hosting. Configure all required environment variables in the hosting provider, and deploy Firestore/Storage rules separately.

GitHub Pages serves static files only. It cannot execute these Next.js server API routes, verify Firebase Admin tokens, keep the AI secret server-side, or accept secure server uploads. Therefore this full-stack version cannot be deployed as a functional app through the repository's GitHub Pages setting. A static-only export would require removing or separately hosting those server features; use a Node-capable deployment for Phase 1 functionality.

The privacy and terms pages included here are implementation placeholders. Replace them with reviewed policies before making the service available to users.
# premiertravel