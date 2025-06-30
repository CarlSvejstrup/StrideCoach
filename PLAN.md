
### Legend

\| ⬜ | File/dir to create |
\| 🛠 | Existing file to edit |
\| ✅ | Expected outcome |

---

## Phase 0 · Bootstrap

> #### Task 0-1 · Scaffold Next.js App

```text
YOU ARE Chat-with-My-Runs Code Agent.
Goal: create brand-new Next.js 14 project (App Router, TS, Tailwind, ESLint) in root
dir `runs-chat/`.

Actions:
1. Execute `pnpm create next-app@latest runs-chat \
   --typescript --tailwind --eslint --app --src-dir --import-alias "@/"`
2. Confirm `package.json` contains `next`, `react`, `react-dom`, `tailwindcss`.
3. Output no explanatory text—just show the commands run.
✅ Repo root has `/src/app/page.tsx` and Tailwind config.
```

---

> #### Task 0-2 · Install & Init Prisma with SQLite

```text
YOU ARE Chat-with-My-Runs Code Agent.
Add Prisma to existing project.

Actions:
1. Run `pnpm add -D prisma && pnpm add @prisma/client`.
2. Run `npx prisma init --datasource-provider sqlite`.
✅ `/prisma/schema.prisma` exists; datasource url uses `DATABASE_URL="file:./dev.db"`.
```

---

> #### Task 0-3 · Add Environment Template

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `.env.example` in repo root with:
  STRAVA_CLIENT_ID=
  STRAVA_CLIENT_SECRET=
  STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
  DATABASE_URL="file:./dev.db"
No secrets—just placeholders.
✅ File committed.
```

---

> #### Task 0-4 · Hello-World Home Page

```text
YOU ARE Chat-with-My-Runs Code Agent.
Edit 🛠 `src/app/page.tsx` to render:
  • Title “Chat-with-My-Runs”
  • Button “Import Recent Activities”
Use Tailwind classes, responsive container, and link button to `/import`.
✅ `pnpm dev` shows styled landing page.
```

---

## Phase 1 · OAuth + Import

> #### Task 1-1 · Define Prisma Schema

```text
YOU ARE Chat-with-My-Runs Code Agent.
Open 🛠 `/prisma/schema.prisma` and replace model block area with:

model Athlete {
  id           Int      @id @default(autoincrement())
  accessToken  String
  refreshToken String
  expiresAt    Int
  activities   Activity[]
}

model Activity {
  id          Int     @id @default(autoincrement())
  stravaId    Int     @unique
  name        String
  type        String
  startTime   DateTime
  distanceM   Float
  movingS     Int
  averageHr   Float?
  athleteId   Int
  athlete     Athlete @relation(fields: [athleteId], references: [id])
}

Save & run `npx prisma migrate dev --name init`.
✅ SQLite `dev.db` created with two tables.
```

---

> #### Task 1-2 · Strava OAuth Callback Route

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/app/api/strava/callback/route.ts`.

Requirements:
1. Accept GET; read `code` query param.
2. POST to `https://www.strava.com/oauth/token` with
   { client_id, client_secret, code, grant_type:"authorization_code" }.
3. Persist tokens & expiry in `Athlete` (create or update first row only).
4. Redirect user to `/import`.

Use `fetch`, `process.env.*`, Prisma client singleton.
✅ Visiting `/api/strava/callback?code=TEST` stores row in DB.  
```

---

> #### Task 1-3 · “Import Recent Activities” API Route

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/app/api/strava/import/route.ts`.

Flow:
1. Load Athlete row; refresh token if `expiresAt <= Date.now()/1000 + 3600`
   via POST `grant_type:refresh_token` (docs :contentReference[oaicite:0]{index=0}).
2. GET `/athlete/activities?after={unixNow-14d}&per_page=200`.
3. For each activity not yet in DB, insert into `Activity` table (basic
   fields only; no streams yet).
Return JSON `{ imported: <count> }`.
✅ Hitting route imports last 14 days without duplicates.
```

---

> #### Task 1-4 · Front-end Import Trigger

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/app/import/page.tsx`.

Features:
• On mount, call `/api/strava/import` via fetch.
• Show spinner while loading.
• After success, show “Imported X activities” and link “Go to Chat”.
Use React hooks + Tailwind.
✅ Workflow: click landing-page button → OAuth (first time) → auto-import page.
```

---

## Phase 2 · GPS Stream Storage (optional)

> #### Task 2-1 · Save Stream Points

```text
YOU ARE Chat-with-My-Runs Code Agent.
Extend 🛠 `prisma/schema.prisma` with:

model StreamPoint {
  id          Int      @id @default(autoincrement())
  activityId  Int
  ts          Int
  lat         Float
  lon         Float
  ele         Float?
  hr          Float?
  Activity    Activity @relation(fields: [activityId], references: [id])
  @@index([activityId, ts])
}

Run `npx prisma migrate dev --name streams`.

Update `/api/strava/import`:
• For each activity, call `/activities/{id}/streams?keys=time,latlng,altitude,heartrate`.
• Bulk-insert rows (Prisma `createMany`).
✅ For a new run, associated `StreamPoint` rows appear (≈ 1 row/sec).
```

---

## Phase 3 · Chat MVP

> #### Task 3-1 · Serverless Chat Endpoint

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/app/api/chat/route.ts` (POST).

Input JSON: `{ "prompt": string }`.

Steps:
1. Read last 30 activities from DB (`distanceM`, `movingS`, `startTime`).
2. Assemble context JSON (max 4 k chars).
3. Call Google Vertex “gemini-1.5-flash” with
   system prompt: “You are Carl’s running coach…”
4. Return LLM reply as `{ reply }`.

Use dotenv var `GEMINI_API_KEY`.
✅ Curl POST returns coach answer.
```

---

> #### Task 3-2 · Prompt Template Helper

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/lib/prompt.ts`.

Export function `buildPrompt(userQuestion, contextJson)` that returns:

"""
SYSTEM: You are a friendly running coach.  
CONTEXT (JSON): {contextJson}  
USER: {userQuestion}
"""

✅ Imported by chat route; unit test passes string contains both parts.
```

---

> #### Task 3-3 · Simple Chat UI

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/app/chat/page.tsx`.

Features:
• Textarea for question, submit button.
• Message list with user & assistant bubbles.
• Calls `/api/chat`, streams response.
• Tailwind styling, dark-mode friendly.

✅ Ask “How far did I run last week?” → answer appears.
```

---

## Phase 4 · Basic Dashboard

> #### Task 4-1 · Activity List Component

```text
YOU ARE Chat-with-My-Runs Code Agent.
Create ⬜ `src/components/ActivityTable.tsx`.

Query `/api/activities` (new GET route; implement quickly).
Show table: Date, Sport, Distance km, Pace, Avg HR.

Pagination not needed (<200 rows).
✅ Component renders in `/dashboard`.
```

---

> #### Task 4-2 · Sport Filter Buttons

```text
YOU ARE Chat-with-My-Runs Code Agent.
Enhance ActivityTable: add filter chips “All / Run / Ride / Other”.
Client-side filter state only.

✅ Clicking “Run” narrows table instantly.
```

---

## Phase 5 · Deployment & Auth Guard

> #### Task 5-1 · Vercel CI Pipeline

```text
YOU ARE Chat-with-My-Runs Code Agent.
Add ⬜ `.github/workflows/deploy.yml`:

name: Deploy
on: push
jobs:
  vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm prisma generate
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

✅ Push to main triggers Vercel preview build.
```

---

> #### Task 5-2 · Simple Password Gate

```text
YOU ARE Chat-with-My-Runs Code Agent.
Install `next-auth`.

Add env `NEXTAUTH_SECRET`.

Implement credentials provider where username === `CARL`
and password matches `process.env.APP_PASSWORD`.

Wrap `/dashboard` and `/chat` with `withAuth` middleware.

✅ Visiting page when unauthenticated redirects to `/login`.
```

---

### How to Use

1. Copy a prompt → open ChatGPT Code Interpreter or GitHub Copilot chat → paste.
2. Let Codex write code/commands → run output in your terminal.
3. Commit after each green check ✅.

Happy coding!
