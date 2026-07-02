# PrepArc — Full Project Documentation

## Overview

PrepArc is a full-stack FAANG interview prep platform built with Next.js 15. It covers DSA problem sheets, system design practice, an AI-powered RAG mentor, and a code execution playground — all behind a secure authentication layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth.js (Google OAuth + Credentials) |
| Database | Neon PostgreSQL + Prisma ORM |
| Vector search | pgvector (on Neon) |
| LLM | Groq (llama-3.3-70b-versatile) |
| Embeddings | Voyage AI (voyage-3-lite, 1024-dim) |
| Rate limiting | Upstash Redis |
| Code execution | Judge0 CE |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values before running.

```
DATABASE_URL          Neon PostgreSQL connection string (with pgvector)
NEXTAUTH_SECRET       Random 32-char secret (openssl rand -base64 32)
NEXTAUTH_URL          App URL — http://localhost:3000 in dev, your domain in prod
GOOGLE_CLIENT_ID      Google OAuth client ID
GOOGLE_CLIENT_SECRET  Google OAuth client secret
GROQ_API_KEY          Groq API key (free at console.groq.com)
VOYAGE_API_KEY        Voyage AI key (for RAG embeddings)
UPSTASH_REDIS_REST_URL    Upstash Redis REST URL (optional — skips rate limiting if absent)
UPSTASH_REDIS_REST_TOKEN  Upstash Redis token
INGEST_SECRET         Any secret string to protect the /api/mentor/ingest endpoint
JUDGE0_API_KEY        RapidAPI key for Judge0 (optional — uses free public endpoint if absent)
```

---

## Third-Party Service Setup

### 1. Neon PostgreSQL

**URL:** https://neon.tech

1. Sign up → **New Project** → choose a region close to your users.
2. Copy the **Connection string** (with `?sslmode=require`) → `DATABASE_URL`.
3. In the Neon dashboard → **Extensions** → enable `vector` (pgvector). This is required for RAG to work.
4. Run migrations: `npx prisma migrate deploy`
5. Seed preset data: `npx prisma db seed`

### 2. Google OAuth

**URL:** https://console.cloud.google.com

1. Create a new project (or select existing).
2. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`
5. Copy **Client ID** → `GOOGLE_CLIENT_ID` and **Client Secret** → `GOOGLE_CLIENT_SECRET`.

### 3. Groq AI (LLM)

**URL:** https://console.groq.com

1. Sign up → **API Keys → Create API Key**.
2. Copy the key → `GROQ_API_KEY`.
3. Free tier is generous (~14,400 requests/day on llama-3.3-70b). No billing required to start.

### 4. Voyage AI (RAG Embeddings)

**URL:** https://dash.voyageai.com

1. Sign up → **API Keys → Create new key**.
2. Copy the key → `VOYAGE_API_KEY`.
3. Free tier: 50M tokens/month. The `voyage-3-lite` model produces 1024-dim vectors.
4. After deploying, populate the knowledge base (see **RAG Setup** below).

### 5. Upstash Redis (Rate Limiting)

**URL:** https://console.upstash.com

1. Sign up → **Create Database** → choose **Regional** → pick your region.
2. Go to **REST API** tab → copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
3. Rate limits configured:
   - `/api/auth/register`: 5 registrations / hour / IP
   - `/api/mentor/chat`: 30 messages / minute / user
   - `/api/mentor/generate-sheet`: 5 sheet generations / hour / user
4. If these vars are not set, rate limiting is silently skipped (safe for local dev).

### 6. Judge0 (Code Execution)

**URL:** https://rapidapi.com/judge0-official/api/judge0-ce

1. Sign up for RapidAPI → subscribe to **Judge0 CE** (free tier available).
2. Copy your **RapidAPI Key** → `JUDGE0_API_KEY`.
3. Without this key, the app falls back to the public `ce.judge0.com` endpoint (may be rate-limited by Judge0).

---

## RAG Setup (AI Mentor Knowledge Base)

The AI Mentor is a **RAG system**, not a plain chatbot. Here is how it works:

```
User message
    │
    ▼
Voyage AI embeds the query (1024-dim vector)
    │
    ▼
pgvector cosine similarity search on KnowledgeChunk table
    │
    ▼
Top-4 relevant chunks injected into the system prompt
    │
    ▼
Groq LLM generates a grounded response
```

### Populating the Knowledge Base

The knowledge base contains DSA pattern explanations and system design concept guides located in:
- `src/lib/knowledge/dsa-patterns.ts`
- `src/lib/knowledge/system-design.ts`

**You must run the ingest once after first deploy** (and whenever you update the knowledge files):

```bash
curl -X POST https://yourdomain.com/api/mentor/ingest \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-INGEST_SECRET-value"}'
```

Response will be a JSON list of each document with `"status": "ok"` or an error message.

In local dev:
```bash
curl -X POST http://localhost:3000/api/mentor/ingest \
  -H "Content-Type: application/json" \
  -d '{"secret": "dev-ingest-secret"}'
```

Without `VOYAGE_API_KEY`, the mentor still works as a plain LLM chatbot — RAG is silently disabled.

---

## Database Schema

### Core Models

| Model | Purpose |
|---|---|
| `User` | Auth user; `image` field stores Google URL or `"avatar:1"–"avatar:4"` |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | Active sessions (NextAuth) |
| `Sheet` | DSA problem sheets (preset or custom) |
| `Problem` | Individual DSA problems linked to a sheet |
| `TestCase` | Hidden/visible test cases for code execution |
| `UserProblemStatus` | Per-user problem status (TODO/SOLVING/DONE) |
| `SystemDesignQuestion` | System design practice questions (33 total) |
| `UserNote` | Markdown notes per problem or system design question |
| `KnowledgeChunk` | RAG knowledge base; `embedding` column is `vector(1024)` |
| `ChatMessage` | Persistent chat history per user per context |

---

## Application Pages

### Public
- `/` — Landing page with hero, feature highlights, CTA
- `/login` — Sign in (Google OAuth or email/password)
- `/register` — Create account with email/password

### Dashboard (requires auth)
- `/dashboard` — Home; progress overview, streak, quick actions
- `/dashboard/dsa` — DSA sheet; infinite scroll, status tracking, notes, code editor
- `/dashboard/problem/[id]` — Individual problem with code editor + AI hint sidebar
- `/dashboard/system-design` — System design question list + Challenge Spinner
- `/dashboard/mentor` — Full-page AI mentor chat
- `/dashboard/profile` — Edit name, avatar (non-Google users), experience level, target company

---

## API Reference

### Auth
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | ALL | NextAuth handler (login, logout, session) |
| `/api/auth/register` | POST | Email/password registration. Body: `{ name, email, password }`. Rate limited: 5/hr/IP. |

### DSA
| Endpoint | Method | Description |
|---|---|---|
| `/api/dsa/problems` | GET | Paginated problem list. Params: `sheetId`, `page`, `limit`, `pattern`, `difficulty`, `status` |
| `/api/dsa/status` | POST | Update problem status. Body: `{ problemId, status: "TODO"|"SOLVING"|"DONE" }` |

### Notes
| Endpoint | Method | Description |
|---|---|---|
| `/api/notes/upsert` | POST | Create or update a note. Body: `{ problemId?, sdQuestionId?, content }`. Max 50,000 chars. |

### User
| Endpoint | Method | Description |
|---|---|---|
| `/api/user/profile` | PATCH | Update profile. Body: `{ name?, image?, experienceLevel?, targetCompany? }`. `image` only accepts `"avatar:1"–"avatar:4"`. |

### Code Execution
| Endpoint | Method | Description |
|---|---|---|
| `/api/code/run` | POST | Run code. Body: `{ code, language, stdin? }`. Uses Judge0 CE. |

### AI Mentor
| Endpoint | Method | Description |
|---|---|---|
| `/api/mentor/chat` | POST | Streaming RAG chat. Body: `{ message, context? }`. Returns `text/plain` stream. Rate limited: 30/min/user. |
| `/api/mentor/generate-sheet` | POST | AI-generated custom DSA sheet. Body: `{ message }`. Max 2000 chars. Rate limited: 5/hr/user. |
| `/api/mentor/ingest` | POST | Populate RAG knowledge base. Body: `{ secret }`. Admin-only. |

---

## Auth Flow

```
Google OAuth
    User clicks "Continue with Google"
    → NextAuth redirects to Google
    → Google returns to /api/auth/callback/google
    → NextAuth creates/updates User + Account records
    → Session cookie set

Email/Password
    Register: POST /api/auth/register → bcrypt(password, 12) → User created
    Login: POST /api/auth/signin (NextAuth credentials provider)
           → bcrypt.compare → session cookie set
```

Passwords are hashed with bcryptjs at cost factor 12. Plaintext passwords are never stored.

---

## Avatar System

Non-Google users get one of four animated emoji avatars. These are stored as `"avatar:1"` through `"avatar:4"` in the `User.image` field (the same field Google OAuth uses for profile photo URLs).

- `src/lib/avatar.ts` — `AVATARS` array, `isLocalAvatar()`, `getAvatarMeta()`, `randomAvatarKey()`
- `src/components/ui/UserAvatar.tsx` — renders the correct avatar everywhere (Google image → emoji → initials fallback)
- New registrations are assigned a random avatar automatically.
- Users can change their avatar on the Profile page.

---

## Floating AI Mentor

A persistent floating chat widget (`src/components/dashboard/FloatingMentor.tsx`) is visible on all dashboard pages except `/dashboard/mentor` (which has the full-page version).

- Bottom-right corner, z-index 50
- Collapsed: circular sky-blue button with a Sparkles icon
- Expanded: 360×520px panel with minimize (–) and close (×) controls
- Context-aware: sends `"dsa"`, `"system-design"`, or `"dashboard"` as context depending on current page
- Full chat history persisted to DB per context

---

## Security

| Concern | Implementation |
|---|---|
| Passwords | bcryptjs, cost 12 |
| CSRF | NextAuth built-in CSRF protection |
| Input validation | Email regex + length limits on all POST bodies |
| Enum validation | Allowlist checks for `status`, `pattern`, `difficulty` |
| Content limits | Notes: 50k chars; Chat: 4k chars; Sheet prompt: 2k chars |
| Rate limiting | Upstash sliding window (register, chat, sheet generation) |
| Avatar injection | Profile PATCH only accepts `"avatar:*"` prefix; Google images can't be overwritten |
| Secrets | `.env*` in `.gitignore`; no hardcoded credentials anywhere |
| Auth on all routes | All API routes check `getServerSession()` before any DB access |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login + register pages (dark panel layout)
│   ├── dashboard/           # All authenticated pages
│   │   ├── dsa/             # DSA sheet page
│   │   ├── problem/[id]/    # Individual problem + code editor
│   │   ├── system-design/   # System design list + spinner
│   │   ├── mentor/          # Full-page mentor chat
│   │   └── profile/         # User profile settings
│   ├── api/                 # All API routes
│   └── globals.css          # Tailwind v4 base + focus-visible overrides
├── components/
│   ├── auth/                # AuthCard
│   ├── dashboard/           # Sidebar, MentorChat, FloatingMentor, ProfileForm, ProblemList
│   ├── system-design/       # ChallengeSpinner, QuestionList
│   └── ui/                  # UserAvatar, shared primitives
└── lib/
    ├── avatar.ts            # Avatar key helpers
    ├── cn.ts                # clsx + twMerge utility
    ├── knowledge/           # RAG source documents
    │   ├── dsa-patterns.ts
    │   └── system-design.ts
    ├── prisma.ts            # Prisma client (PrismaNeon adapter)
    ├── rag.ts               # Voyage AI embed + pgvector retrieval + ingestDocument
    └── ratelimit.ts         # Upstash rate limiters (register, chat, sheet)
prisma/
├── schema.prisma
├── seed.ts                  # Preset sheets, problems, 33 system design questions
└── migrations/
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill env vars
cp .env.example .env.local

# 3. Push schema to your Neon DB
npx prisma migrate deploy

# 4. Seed preset data (sheets + system design questions)
npx prisma db seed

# 5. Start dev server
npm run dev

# 6. (Optional, requires VOYAGE_API_KEY) Populate RAG knowledge base
curl -X POST http://localhost:3000/api/mentor/ingest \
  -H "Content-Type: application/json" \
  -d '{"secret": "dev-ingest-secret"}'
```

---

## Deployment Checklist

- [ ] All env vars set in hosting platform (Vercel / Railway / etc.)
- [ ] `NEXTAUTH_URL` set to your production domain
- [ ] Google OAuth redirect URI updated to production URL
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] `npx prisma db seed` run to populate preset content
- [ ] `POST /api/mentor/ingest` called once with your `INGEST_SECRET` to populate RAG
- [ ] Verify `.env.local` is NOT committed (`git status` should not show it)
- [ ] Upstash Redis connected (rate limiting active in prod)
