# 🏃‍♂️ StrideCoach — AGENTS.md  
**Guidelines for OpenAI Codex & other AI code agents working in this repo**

---

## 1 · Mission & Scope

You are **Chat-with-My-Runs Code Agent**.  
Your sole purpose is to evolve **StrideCoach**, a hobby-budget, single-user web app that:

1. **Imports** the author’s Strava activities (last 14 days, manual trigger).  
2. **Stores** summaries (and optionally full GPS streams) in SQLite/Prisma.  
3. Exposes a **chat interface** that pipes context-filtered activity data to an LLM  
   (default **Gemini 1.5 Flash**, escalates to **GPT-4o** when flagged).  
4. Renders a **dashboard** of recent workouts with filter controls.  

Keep the codebase **private-by-default** (single user, no public signup).

---

## 2 · Repo Layout for Fast Nav

| Path | Purpose | Agent Notes |
|------|---------|-------------|
| `/src/app/**` | Next.js 14 **App Router** pages & API routes | Generate route handlers here |
| `/src/components` | React UI building blocks | Use functional components + hooks |
| `/src/lib` | Non-UI helpers (Prisma singleton, prompt builder, auth) | Co-locate small libs here |
| `/prisma` | `schema.prisma`, migrations | Run `npx prisma migrate dev` after edits |
| `/public` | Static assets (SVG, icons) | Do **not** overwrite user assets |
| `/tests` | Jest/Playwright tests | Extend tests when adding features |
| `.github/workflows` | CI (Vercel deploy) | Ensure all checks pass |

*(The root hosts config files, `.env.example`, and this AGENTS.md.)*

---

## 3 · Coding Standards

### 3.1 General
- **TypeScript** everywhere. No `.js` in `/src`.
- Follow existing ESLint/Tailwind setup (`pnpm lint` must stay green).
- Prefer **async/await** over `.then()` chains.
- Write **meaningful names** (`importActivities`, `buildPrompt`).

### 3.2 React (UI)
- Use functional components + hooks (`useState`, `useEffect`, `useSWR`).
- File naming: `PascalCase.tsx`. One component per file.
- Keep components ≤ 200 LOC; extract sub-components as needed.
- Props must be explicitly typed (`interface ActivityRowProps { … }`).

### 3.3 Styling
- **Tailwind CSS** utility-first.  
  - Use semantic class groupings: `p-4 border rounded-lg shadow`.
  - Custom CSS only in `/src/styles/globals.css`.
- Dark-mode friendly colours (Tailwind `dark:` utilities).

### 3.4 Backend / Data
- Use **Prisma** client singleton (`/src/lib/prisma.ts`) to prevent hot-reload floods.
- All DB writes guarded by try/catch; log error then rethrow.
- For large inserts (GPS streams) prefer `createMany` over loops.

### 3.5 LLM Calls
- Default model: *Gemini-Flash* via REST.  
  Escalate to GPT-4o **only when**:
  1. Prompt flagged with `!highres` **or**
  2. Estimated token count > 2 k.
- Prompt template lives in `/src/lib/prompt.ts`.
- Strip personally identifiable text before sending (route names, comments).

---

## 4 · Environment Variables

Variable | Usage
---------|-------
`STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | OAuth handshake
`STRAVA_REDIRECT_URI` | Usually `https://YOURDOMAIN/api/strava/callback`
`DATABASE_URL` | `file:./dev.db` (local) or Turso URL
`GEMINI_API_KEY` | Google Vertex key
`OPENAI_API_KEY` (optional) | Used when escalating to GPT-4o
`NEXTAUTH_SECRET` | JWT signing key
`APP_PASSWORD` | Simple credential login

> **Never** commit `.env` files. `.env.example` is the only tracked variant.

---

## 5 · Commit & PR Workflow

1. **Small, atomic commits** (one logical change).  
   - Good: “add StreamPoint model & migration”  
   - Bad: “misc bugfixes”  
2. Always run:  

   ```bash
   pnpm lint && pnpm type-check && pnpm test
