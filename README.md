# Codeward — AI-Powered Interview Prep Platform

A full-stack interview prep platform: curated DSA sheets with pattern tracking, system design practice, code review and debugging exercises, staged low-level-design builds with real code execution, long-form distributed-systems deep dives, and a RAG-powered AI mentor that adapts to your experience level and target company.

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
- Auto-growing input (Shift+Enter for a newline), scroll stays pinned to the bottom while streaming unless you've scrolled up to re-read
- Markdown rendering is lazy-loaded and sanitized (`rehype-sanitize`) before display
- Rate-limited per user (Upstash Redis) on chat, eval, sheet generation, and add-to-sheet

### System Design
- **Curated questions** organized by difficulty (Easy / Medium / Hard) and experience level (Junior / Mid / Senior), with "must do" flags and one-line summaries
- **Challenge Spinner**: generates a randomized design prompt — *problem × scale × traffic spike × special constraint* — with a copyable prompt to practice against

### Code Review
- **15 hand-authored PRs** with planted bugs across payments, auth, caching, and infra — each at a graded severity
- Syntax-highlighted code; click any line to leave an inline review comment, plus optional overall notes
- The AI grades your review against the ground-truth bug list (severity-weighted score) and shows, per bug, whether you caught it — with the evidence phrase it matched from your comments

### Bug Hunt
- **9 broken codebases** with failing tests and real log excerpts — races, N+1s, resource leaks, deadlocks, timezone bugs
- **Editable code**: fix the bug directly in a syntax-highlighted editor (CodeMirror), then write your root-cause diagnosis
- The AI grades it as a **structured, line-anchored diff review** — findings tagged root-cause / side-effect and fixed / partial / missed / introduced, with counts and senior-reviewer feedback — then reveals the canonical fix and the tempting wrong turns it ruled out

### Build It (low-level design)
- **5 staged LLD problems**: thread-safe wallet, inventory reservation service, durable background job queue, idempotent payment processor, notification delivery service
- Each evolves across **4 stages**, every stage adding one constraint that breaks the previous design; stage 3 is the "make-or-break" — proving a correctness invariant holds under concurrency
- Three languages per problem: **C#, Python, Kotlin**
- **Real code execution**: a Code / Tests split with a "Run Tests" button that runs your code against per-language test harnesses via the JDoodle Compiler API — guarded by a shared daily budget (server-side counter) and a per-user rate limit, with graceful fallback to LLM-only grading when the budget is spent
- The AI grades the *mechanism* and the invariant argument against a weighted rubric; stages unlock sequentially on submission
- All content is free (nothing locked)

### Deep Dives
- **13 long-form articles** on distributed systems (idempotency, caching, rate limiting, Kafka, Raft, consistent hashing, sagas & outbox/CDC, two-phase commit, distributed locks, and more)
- **Sectioned reader**: each article is split into numbered, collapsible sections with a per-section "mark complete" toggle and a progress bar (persisted in localStorage)
- Prerequisites / after-this / suggested-first-pass and canonical references header, experience-level chips, and prev/next navigation with a topic rail

### Auth & Onboarding
- Google OAuth (one-click) and email/password (bcrypt, 12 rounds)
- Onboarding flow capturing experience level and target company
- Profile page laid out as a sticky identity/stats card (avatar, experience level, target company, attempt/sheet counts) alongside an editable profile form with a selectable avatar

### Dashboard Home
- Hero banner with greeting, target company / experience level, an overall progress ring, and inline solved / sheets / custom stats
- **Continue where you left off** plus a revision queue of problems you flagged
- A **compact one-row Practice launcher** across all seven modes, each with its live count (problems, PRs, bugs, builds, topics)
- Your sheets (including an "ask the mentor to build one" card), with **pattern breakdown and recent activity paired side-by-side**

### Landing Page
- Hero with a **rotating topic headline** ("Master DSA / system design / code review / …") over a layered emerald glow — a permanent top glow plus a smaller spotlight that **follows the cursor** (rAF-throttled, CSS-variable driven, reduced-motion aware)
- A **floating product showcase** under the hero: a full Code Review workspace mockup — mode sidebar with problem counts, syntax-highlighted diff with flagged bug lines, severity-scored issues panel — drifting gently up and down on an emerald backlight
- An animated logo marquee ("problems asked in real interviews at…") with real company logos, and a section for each of the seven practice modes — DSA Sheets, AI Mentor, System Design, Code Review, Bug Hunt, Build It, and Deep Dives — each with its own product mockup, separated by shimmering section dividers
- Mockups share the same mac-style windowed chrome as the real in-app workspaces (boxy black cards, emerald-highlighted active items), so the marketing screenshots match the actual product
- The sign-up page carries the same ambient emerald glow behind the auth card
- Multi-column footer with brand/tagline and Practice, Account, and Company link columns

### Company Pages
- **About** — the project's story in numbered sections (why it exists, what's inside, the principles, who it's for) over a dot-matrix hero, with alternating section bands
- **Contact**, **Privacy Policy**, and **Terms of Service** — a shared marketing shell with an emerald-dot "Legal" eyebrow, a greyed last-updated line, and the same dot-matrix header
- Privacy documents exactly what's collected and every third-party processor (Google, Groq, Voyage AI, JDoodle, Neon, Upstash, Vercel); Terms covers acceptable use, the code-execution sandbox, and the no-warranty stance

### Polish
- Dashboard top nav: brand/logo doubles as the Home link (no separate "Home" item), pinned far left, with all section links, the user menu, and sign-out grouped on the right
- Instant navigation feedback (spinner swap on sidebar links and sheet tabs) with zero layout shift — no route-level skeletons
- Toasts confirm every mutation (sheet create/delete, add problems, status/revise toggles); optimistic UI reverts and reports failures instead of silently diverging
- Accessible by default: keyboard-visible focus rings, `aria-current`/`aria-expanded`/`aria-label` on interactive controls, `prefers-reduced-motion` respected (including the landing page's logo marquee)
- WCAG AA-compliant secondary text contrast
- Installable as a PWA (favicon set + manifest)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Server Components, Turbopack, React Compiler) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (Inter + JetBrains Mono) |
| Auth | NextAuth.js v4 (JWT sessions) |
| Database | Neon PostgreSQL (serverless, `ap-southeast-1`) |
| ORM | Prisma 7 |
| Vector search | pgvector + Voyage AI embeddings |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Code execution | JDoodle Compiler API (C#, Python, Kotlin, Node) |
| Code editor | CodeMirror 6 (lazy-loaded) |
| Rate limiting | Upstash Redis |
| Analytics | Vercel Analytics |
| Hosting | Vercel (functions pinned to `sin1` to co-locate with the database) |
| Hardening | Security headers, `rehype-sanitize` on AI output |

---

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database with the **pgvector** extension enabled
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client
- A [Groq](https://console.groq.com) API key (free tier available)
- A [Voyage AI](https://dash.voyageai.com) API key (for RAG embeddings)
- Optional: [Upstash Redis](https://console.upstash.com) — rate limiting is silently skipped if not set
- Optional: [JDoodle](https://www.jdoodle.com) Compiler API credentials — Build It's "Run Tests" is hidden if not set (grading stays LLM-only)

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
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting + the shared Build It code-execution budget (skipped in dev if unset) |
| `JDOODLE_CLIENT_ID` / `JDOODLE_CLIENT_SECRET` | Optional | Build It "Run Tests" code execution — the button is hidden and grading stays LLM-only if unset |

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
│   ├── about/ contact/          # Company pages — About, Contact,
│   ├── privacy/ terms/          #   Privacy Policy, Terms of Service
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
│   │   ├── review/grade/        # Code Review grading (severity-weighted)
│   │   ├── bug-hunt/grade/      # Bug Hunt grading (line-anchored diff review)
│   │   ├── build-it/grade/      # Build It design/invariant grading
│   │   ├── code/run/            # JDoodle code execution ("Run Tests")
│   │   ├── notes/               # Per-problem notes
│   │   └── user/profile/        # Profile + onboarding
│   └── dashboard/
│       ├── page.tsx             # Dashboard home
│       ├── dsa/                 # DSA sheets + Problem Bank
│       ├── mentor/              # Full-page AI mentor
│       ├── system-design/       # System design questions + [id] detail
│       ├── code-review/         # Code Review workspace + [slug]
│       ├── bug-hunt/            # Bug Hunt workspace + [slug]
│       ├── build-it/            # Build It workspace + [slug]
│       ├── deep-dives/          # Deep Dive reader + [slug]
│       └── profile/             # Profile page
├── content/                     # Content-as-code (meta/ground-truth split)
│   ├── code-reviews/            # 15 planted-bug PRs
│   ├── bug-hunts/               # 9 debugging exercises
│   ├── build-it/                # 5 staged LLD problems + test harnesses
│   └── deep-dives/              # 13 long-form articles
├── components/
│   ├── dashboard/               # Sheet UI, mentor chat, modals, sidebar
│   ├── landing/                 # Nav, footer, hero glow, product showcase,
│   │                            #   mockups, shared marketing page shell
│   ├── system-design/           # Challenge Spinner, etc.
│   ├── code-review/ bug-hunt/ build-it/ deep-dives/  # Mode workspaces
│   └── ui/                      # Shared primitives (CodeEditor, Ring, …)
├── lib/
│   ├── auth.ts                  # NextAuth config + getSessionUserId()
│   ├── prisma.ts                # Prisma client
│   ├── rag.ts                   # Retrieval + embeddings
│   ├── ratelimit.ts             # Upstash limiters
│   ├── jdoodle.ts               # JDoodle code-execution client
│   ├── execBudget.ts            # Shared daily code-execution budget guard
│   ├── knowledge/               # RAG knowledge base source
│   └── ...
├── types/
│   └── next-auth.d.ts           # Types session.user.id
prisma/
├── schema.prisma
├── seed.ts                      # Seeds all preset sheets
├── problem-content.ts           # Problem descriptions
└── top300.ts                    # Top 300 FAANG bank
```

---

## Security

- Every data API route authenticates via `getSessionUserId()` (`src/lib/auth.ts`) before any DB access — a single call backed by the JWT, no per-request user lookup
- `/api/mentor/ingest` is **fail-secure** — returns 503 if `INGEST_SECRET` is unset, 401 on mismatch
- Google OAuth tokens are never persisted — the app only uses Google to authenticate, so `access_token`/`refresh_token`/`id_token` are stripped before the `Account` row is written
- AI-generated markdown is sanitized with `rehype-sanitize` (XSS protection)
- **Ground truth never reaches the client**: Code Review bug lists, Bug Hunt root causes/fixes, and Build It rubrics/canonical answers live in a server-only half of a meta/solution content split — only the grading routes import the solution accessor (verified against the client bundle)
- **Code execution is sandboxed and budgeted**: candidate code runs in JDoodle's network-disabled sandbox (never on our infra); `/api/code/run` is authenticated, per-user rate-limited, and gated by a shared server-side daily budget so it can't be drained or abused
- Rate limiting (Upstash) on mentor chat, eval, sheet generation, add-to-sheet, code execution, and sign-up
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, etc.) set in `next.config.ts`
- Groq-calling routes set `maxDuration` so slow grading/streaming finishes instead of hitting the default function timeout
- Passwords hashed with bcrypt (12 rounds); sheet queries scoped to preset or owning user

---

## Deployment

Deployed on Vercel. A few things that matter if you fork this:

- **Function region**: `vercel.json` pins functions to `sin1` (Singapore) to co-locate with the Neon database in `ap-southeast-1` — cross-region round trips otherwise dominate page load time. If you move the database, update this to match.
- **Environment variables**: set the full list from [Setup](#2-configure-environment-variables) in the Vercel project settings for both **Production** and **Preview**, including the Upstash pair — without it, rate limiting silently no-ops in production too.
- **`NEXTAUTH_URL`**: must exactly match the deployed domain (no trailing slash), and that domain must be added to the Google OAuth client's **Authorized JavaScript origins** and **Authorized redirect URIs** (`<domain>/api/auth/callback/google`). Preview deployments get a per-commit URL, so Google sign-in won't work there unless you assign the preview branch a stable domain and register it too.
- **Build**: `prisma generate` runs automatically via the `build` script and `postinstall` — no manual step needed on a fresh Vercel install.

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
