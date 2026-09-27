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

## Phase 2 tools

The existing Phase 1 chat, writing, study, PDF, authentication, and history routes remain in place. Phase 2 adds:

- `/tools/image`: server-side image generation, prompt description, background removal, and enhancement adapters.
- `/tools/voice`: audio transcription, meeting notes/audio summaries, optional browser recording, and text-to-speech.
- `/tools/business`, `/tools/travel`, and `/tools/coding`: configurable task workbenches backed by `/api/business`, `/api/travel`, and `/api/coding`.
- `/agents`: controlled sequential workflows whose task lists are explicitly defined in `lib/agents.ts`; no browsing, purchases, or code execution.
- Searchable/categorized tool discovery, account-level favorites, Ctrl+K search, owner-scoped notifications, richer usage cards, and Free/Pro limit foundations.
- Multi-format file uploads for PDF, TXT, CSV, DOCX, PNG, JPEG, and WebP. TXT/CSV extraction is local; other formats require an extraction service. Rename, search, sort, and delete operations are owner checked.

## Phase 2 environment variables

`.env.example` and `.env.local.example` list the complete variable set. Copy the template to `.env.local`; never put provider secrets in `NEXT_PUBLIC_` variables.

| Variable | Purpose |
| --- | --- |
| `IMAGE_PROVIDER_API_KEY` | Server-only image provider credential |
| `IMAGE_PROVIDER_BASE_URL` | Provider base URL; must support OpenAI-compatible `/images/generations`; image editing/description uses `/images/{describe,remove-background,enhance}` |
| `VOICE_PROVIDER_API_KEY` | Server-only audio provider credential |
| `VOICE_PROVIDER_BASE_URL` | OpenAI-compatible `/audio/transcriptions` and `/audio/speech`; defaults to OpenAI API base |
| `VOICE_TRANSCRIPTION_MODEL` | Optional transcription model; defaults to `whisper-1` |
| `VOICE_SPEECH_MODEL` | Optional speech model; defaults to `tts-1` |
| `DOCUMENT_EXTRACTION_URL` | Optional multipart extractor for DOCX/images; accepts `file` and `mimeType`, returns `{ "text": "..." }` |
| `DOCUMENT_EXTRACTION_API_KEY` | Optional bearer token for the generic document extractor |
| `PDF_TEXT_EXTRACTION_URL` | PDF extraction endpoint; may fall back to `DOCUMENT_EXTRACTION_URL` |
| `PDF_TEXT_EXTRACTION_API_KEY` | Optional PDF extractor bearer token |

The image provider returns either `{ "data": [{ "url": "https://..." }] }` or `{ "data": [{ "b64_json": "..." }] }`. Binary image results are saved to Firebase Storage under `users/{userId}/images/{imageId}` and referenced by owner-scoped Firestore `images/{imageId}` and `history` records. The authenticated image retrieval endpoint checks document ownership before reading Storage.

Voice endpoints return provider transcriptions as text and speech as MP3. Transcripts, meeting summaries, and TTS text/settings are saved to private history; generated audio bytes are returned to the browser and are not retained. Browser microphone recording is optional and requires user permission.

## Plans, usage, and agents

`lib/plans.ts` is the single source of Free/Pro limits. New accounts default to Free; changing `users/{userId}.planId` from the client is blocked by `firestore.rules`. A privileged server/admin action is required to assign Pro. Payments are not integrated. `/api/usage` returns the authenticated user's daily counts and plan limits; mutating AI/file routes reserve usage transactionally on the server before provider work. Existing flat `usage/{userId}` fields continue to support Phase 1 dashboard counters; detailed counts are stored at `usage/{userId}/daily/{YYYY-MM-DD}`.

Agent definitions and fixed tasks live in `lib/agents.ts`. `/api/agents/run` authenticates the caller, enforces the daily limit, runs only those sequential tasks, and records `agentRuns/{runId}` with owner, status and task results. Firestore permits owner reads and denies client writes to agent runs and usage data.

## Adding a tool

1. Add its route, icon, category, provider, input/output descriptions, and usage category to `lib/tools.ts`.
2. Add a plan quota in `lib/plans.ts` if it needs a new usage category.
3. Put secret-bearing provider calls in a server-side `lib/*-ai.ts` adapter and an authenticated `app/api/*/route.ts` handler.
4. Validate the Firebase ID token, input, file ownership, and quota on the server before calling providers.
5. Save results with `userId` ownership and keep the relevant Firestore/Storage rules restrictive.

Deploy the updated security rules after changing `firestore.rules` or `storage.rules`:

```bash
firebase deploy --only firestore:rules,storage
```

Image generation, voice services, PDF/DOCX/image extraction, Firebase server APIs, and interactive features remain unavailable until their respective server environment variables and Firebase services are configured. Missing configuration returns an explicit error; the app does not fabricate provider output.
# premiertravel