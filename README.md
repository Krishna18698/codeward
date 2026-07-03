# Codeward — AI-Powered Interview Prep Platform

A full-stack interview prep platform: curated DSA sheets with pattern tracking, system design practice, and a RAG-powered AI mentor that adapts to your experience level and target company.

---

## Features

### DSA Sheets
- **Preset sheets**: Blind 75, Striver's SDE Sheet, NeetCode 150, and a Top 300 FAANG problem bank
- **Custom sheets**: create your own and pull problems from any preset via search
- **Problem Bank**: browse the Top 300 by pattern, difficulty, company, or "must do"
- **Pattern grouping**: problems grouped by algorithmic pattern (ordered by interview importance), collapsible, each with a one-line description
- **Progress tracking**: per-sheet progress bar with solved / to-do counts
- **Filters & flags**: difficulty and company filters, a "to revise" flag, and per-problem notes that persist
- **Direct links**: LeetCode and GeeksforGeeks links on each problem

### AI Mentor
- **RAG-powered chat** grounded in a curated knowledge base (DSA patterns, system design) — answers from retrieved context, not hallucination
- **Semantic retrieval** via Voyage AI embeddings stored in pgvector
- **Persistent conversations** with saved history
- **Sheet generation**: builds a personalized 15–25 problem study sheet from your goals and target company, and can add problems straight into your sheets
- **Answer evaluation**: reviews your approach and reasoning
- Available both as a **full page** and a **floating panel** across the dashboard
- Rate-limited per user (Upstash Redis); AI markdown is sanitized before rendering

### System Design
- **Curated questions** organized by difficulty (Easy / Medium / Hard) and experience level (Junior / Mid / Senior), with "must do" flags and one-line summaries
- **Challenge Spinner**: generates a randomized design prompt — *problem × scale × traffic spike × special constraint* — with a copyable prompt to practice against

### Auth & Onboarding
- Google OAuth (one-click) and email/password (bcrypt, 12 rounds)
- Onboarding flow capturing experience level and target company
- Profile page with selectable avatar

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Turbopack, React Compiler) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (Inter + JetBrains Mono) |
| Auth | NextAuth.js v4 (JWT sessions) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 |
| Vector search | pgvector + Voyage AI embeddings |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Rate limiting | Upstash Redis |
| Hardening | Security headers, `rehype-sanitize` on AI output |

---

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database with the **pgvector** extension enabled
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client
- A [Groq](https://console.groq.com) API key (free tier available)
- A [Voyage AI](https://dash.voyageai.com) API key (for RAG embeddings)
- Optional: [Upstash Redis](https://console.upstash.com) — rate limiting is silently skipped if not set

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd codeward
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Neon pooled connection string (pgvector enabled) |
| `NEXTAUTH_URL` | ✅ | Base URL, no trailing slash (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | Redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google` |
| `GROQ_API_KEY` | ✅ | LLM for mentor chat, evals, sheet generation |
| `VOYAGE_API_KEY` | ✅ | Embeddings for RAG semantic search |
| `INGEST_SECRET` | ✅ | Protects `/api/mentor/ingest` — any strong random string |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting (skipped in dev if unset) |

### 3. Enable pgvector on Neon

In the Neon SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

> Use `migrate deploy` (not `migrate dev`). Neon's serverless Postgres doesn't support the shadow database that `migrate dev` requires with the `vector` column type.

### 5. Seed the preset sheets

Populates Blind 75, Striver's SDE Sheet, NeetCode 150, and the Top 300 FAANG bank.

```bash
npm run seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Ingest the RAG knowledge base (one-time)

With the app running, embed the DSA/system-design knowledge base into pgvector:

```bash
curl -X POST http://localhost:3000/api/mentor/ingest \
  -H "Content-Type: application/json" \
  -d '{"secret": "<your INGEST_SECRET>"}'
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Login, register
│   ├── api/
│   │   ├── auth/                # NextAuth handlers + registration
│   │   ├── dsa/
│   │   │   ├── bank/            # Top 300 problem bank
│   │   │   ├── bank-patterns/   # Pattern groups for the bank
│   │   │   ├── problems/        # Sheet problems + cross-sheet search
│   │   │   ├── sheets/          # Custom sheet CRUD + add-problem
│   │   │   ├── sheet-companies/ # Distinct companies per sheet
│   │   │   ├── status/          # Problem status upsert
│   │   │   └── revise/          # "To revise" toggle
│   │   ├── mentor/              # RAG chat, conversations, eval,
│   │   │                        #   generate-sheet, add-to-sheet, ingest
│   │   ├── notes/               # Per-problem notes
│   │   └── user/profile/        # Profile + onboarding
│   └── dashboard/
│       ├── page.tsx             # Dashboard home
│       ├── dsa/                 # DSA sheets + Problem Bank
│       ├── mentor/              # Full-page AI mentor
│       ├── system-design/       # System design questions + [id] detail
│       └── profile/             # Profile page
├── components/
│   ├── dashboard/               # Sheet UI, mentor chat, modals, sidebar
│   ├── system-design/           # Challenge Spinner, etc.
│   └── ui/                      # Shared icons/primitives
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── rag.ts                   # Retrieval + embeddings
│   ├── ratelimit.ts             # Upstash limiters
│   ├── knowledge/               # RAG knowledge base source
│   └── ...
prisma/
├── schema.prisma
├── seed.ts                      # Seeds all preset sheets
├── problem-content.ts           # Problem descriptions
└── top300.ts                    # Top 300 FAANG bank
```

---

## Security

- Every data API route authenticates via `getServerSession` before any DB access
- `/api/mentor/ingest` is **fail-secure** — returns 503 if `INGEST_SECRET` is unset, 401 on mismatch
- AI-generated markdown is sanitized with `rehype-sanitize` (XSS protection)
- Rate limiting on mentor chat, sheet generation, evaluation, and sign-up
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, etc.) set in `next.config.ts`
- Passwords hashed with bcrypt (12 rounds); sheet queries scoped to preset or owning user

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Seed preset sheets |
| `npx prisma migrate deploy` | Apply pending DB migrations |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx tsc --noEmit` | TypeScript type check |

---

## License

MIT
