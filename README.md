# PrepArc — FAANG Interview Prep Platform

A full-stack interview preparation platform built for serious engineers. Covers DSA problem tracking, AI mentor chat, code execution with auto-grading, and RAG-powered knowledge retrieval.

---

## Features

### DSA Sheets
- **Preset sheets**: Blind 75, Striver's SDE Sheet, NeetCode 150, Top 300 FAANG Picks
- **Custom sheets**: Create your own, search and add problems from any preset sheet
- **Problem Bank**: Browse and filter the full Top 300 problem set by difficulty, pattern, or "must do"
- **Progress tracking**: Per-sheet progress bar, done/solving/todo counts
- **Pattern grouping**: Problems grouped by algorithmic pattern with collapsible sections
- **Infinite scroll**: Lazy-loads problems as you scroll

### Problem Workspace
- **Full problem statement** with description and test case examples
- **Monaco code editor** with syntax highlighting for Python, JavaScript, TypeScript, Java, C++, Go
- **Code execution** via Judge0 — run against real test cases
- **Auto-tracked status**: advances automatically, no manual clicking
  - `To Do` → `Solving` when you first edit the code
  - `Solving` → `Solved` when all test cases pass
- **AI Mentor chat**: context-aware assistant that knows which problem you're on
- **LLM-as-judge eval**: evaluates your solution for correctness, time complexity, and approach
- **Notes**: per-problem notes that persist across sessions

### AI Mentor
- RAG-powered chat mentor backed by a curated knowledge base (DSA patterns, system design)
- Semantic search with Voyage AI embeddings stored in pgvector
- Responses grounded in retrieved context, not hallucinated
- Rate-limited per user via Upstash Redis

### Auth
- Google OAuth (one-click sign in)
- Email/password credentials
- Onboarding flow capturing experience level and target company

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth.js v4 |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 6 with `PrismaNeon` adapter |
| Vector search | pgvector + Voyage AI embeddings |
| LLM | Groq (llama-3.3-70b) |
| Code execution | Judge0 CE |
| Rate limiting | Upstash Redis |
| Editor | Monaco Editor (`@monaco-editor/react`) |

---

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database with the **pgvector** extension enabled
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client
- A [Groq](https://console.groq.com) API key (free tier available)
- A [Voyage AI](https://dash.voyageai.com) API key (for RAG embeddings)
- Optional: [Upstash Redis](https://console.upstash.com) (rate limiting — silently skipped if not set)
- Optional: [RapidAPI Judge0 key](https://rapidapi.com/judge0-official/api/judge0-ce) (falls back to the public endpoint without it)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd interview-prep-center
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Neon PostgreSQL — must have pgvector enabled
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Groq (LLM for mentor chat + evals)
GROQ_API_KEY="gsk_..."

# Voyage AI (embeddings for RAG)
VOYAGE_API_KEY="pa-..."

# Upstash Redis (optional — rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Ingest secret (protects /api/mentor/ingest, pick any strong string)
INGEST_SECRET="your-secret-here"

# Judge0 via RapidAPI (optional — uses public endpoint without it)
# JUDGE0_API_KEY="your-rapidapi-key"
```

### 3. Enable pgvector on Neon

In the Neon console SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

Or: **Neon Dashboard → Extensions → Add → vector**.

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

> Use `migrate deploy` (not `migrate dev`). Neon's serverless Postgres doesn't support the shadow database that `migrate dev` requires.

### 5. Seed the database

Populates all four preset sheets: Blind 75 (75 problems), Striver's SDE Sheet (191), NeetCode 150 (150), Top 300 FAANG Picks (300).

```bash
npx prisma db seed
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Ingest the RAG knowledge base (one-time)

After the app is running, trigger the knowledge base ingest. This embeds DSA patterns and system design content into pgvector:

```bash
curl -X POST http://localhost:3000/api/mentor/ingest \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret-here"}'
```

---

## Database Schema

```
User
 ├── Sheet[] (custom sheets, userId set)
 │    └── Problem[]
 │         ├── TestCase[]
 │         ├── UserProblemStatus[]
 │         └── UserNote[]
 ├── UserProblemStatus[]
 ├── UserNote[]
 └── ChatMessage[]

Sheet (preset — isPreset: true, userId: null)
 └── Problem[]
      └── TestCase[]

KnowledgeChunk    # RAG — embedded with pgvector
SystemDesignQuestion
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register, onboarding
│   ├── api/
│   │   ├── auth/            # NextAuth handlers
│   │   ├── code/run/        # Judge0 code execution
│   │   ├── dsa/
│   │   │   ├── bank/        # Top 300 problem bank
│   │   │   ├── problems/    # Sheet problems (paginated) + cross-sheet search
│   │   │   ├── sheets/      # Custom sheet CRUD + add-problem
│   │   │   └── status/      # Problem status upsert
│   │   └── mentor/          # RAG chat, LLM-judge eval, ingest
│   └── dashboard/
│       ├── dsa/             # DSA sheets page
│       └── problem/[id]/    # Problem workspace
├── components/
│   ├── dashboard/
│   │   ├── DSAPageClient    # Sheet tabs (client — handles create/delete)
│   │   ├── SheetContent     # Stats bar + problem list (client-fetched on tab switch)
│   │   ├── ProblemList      # Grouped problems with infinite scroll + status toggle
│   │   ├── ProblemBank      # Top 300 browsable grid with filters
│   │   ├── ProblemPicker    # Debounced search + select (used in modals)
│   │   ├── CreateSheetModal # New sheet + pre-load problems in one flow
│   │   ├── AddProblemsModal # Add problems to an existing custom sheet
│   │   ├── MentorChat       # RAG AI mentor panel
│   │   └── EvalPanel        # LLM-as-judge evaluation panel
│   └── problem/
│       ├── ProblemWorkspace # Full IDE-style problem page layout
│       ├── CodeEditor       # Monaco editor, language switching, localStorage save
│       ├── TestCasePanel    # Judge0 test runner with pass/fail results
│       └── NotesPanel       # Per-problem persistent notes
├── lib/
│   ├── prisma.ts
│   └── cn.ts
prisma/
├── schema.prisma
├── seed.ts
├── blind75.ts               # 75 problems
├── strivers.ts              # 191 problems
├── neetcode150.ts           # 150 problems
└── top300.ts                # 300 problems
```

---

## Architecture Notes

**Why `prisma migrate deploy` instead of `migrate dev`?**
`migrate dev` spins up a shadow database to detect drift. Neon serverless doesn't support the shadow DB approach with pgvector — the `vector(1024)` column type fails before the extension can be installed. `migrate deploy` applies migrations directly, skipping shadow DB entirely.

**Why is problem data fetched client-side in `SheetContent`?**
Next.js 16 client-side navigation caches RSC payloads on the client router. When only query params change (e.g. `?sheet=xyz`), the cached payload can be served stale even with `force-dynamic`. Moving the fetch to a `useSearchParams`-driven client component with its own `useEffect` makes tab switching instant and reliable with zero cache concerns.

**Why is status auto-tracked instead of user-controlled?**
Manual toggling creates friction and is inaccurate — users forget to update it. Auto-advancing from TODO → Solving on first code edit, and Solving → Solved when all tests pass, mirrors the real problem-solving workflow and keeps progress data trustworthy.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx prisma migrate deploy` | Apply pending DB migrations |
| `npx prisma db seed` | Seed preset sheets |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx tsc --noEmit` | TypeScript type check |

---

## License

MIT
