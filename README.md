# Baby Planner

Baby Planner is a warm, local-first pregnancy and newborn planning app with an OpenAI Agents SDK planning agent. It helps expecting parents turn due dates, appointments, checklist progress, notes, questions, and concerns into a calm preparation plan.

## Features

- Dashboard with pregnancy progress, trimester, baby-size estimate, next appointment, reminders, notes, and smart next step.
- AI Planner Chat with progressive streamed responses and visible tool progress events.
- Due date and last period date calculator with cycle-length adjustment.
- Appointment tracking with notes, done states, and AI appointment question support.
- Checklists for Hospital Bag, Baby Essentials, Before Birth, and After Birth.
- Notes, readiness review, local storage, dark mode, and export/import backup.
- Baby Planner tools for pregnancy progress, task extraction, birth readiness, appointment questions, checklist prioritization, newborn planning, state summary, and gentle reminders.

## Tech Stack

- React 19 and Vite for the frontend.
- Express for local API routes.
- OpenAI Agents SDK for the agent and tools.
- Zod for request and planner-state validation.
- Local Express auth with PBKDF2 password hashing and HTTP-only session cookies.
- Vitest for tool and setup tests.

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. The key is read only by the Express server. It is never placed in frontend code or local storage.

You can optionally change:

```bash
OPENAI_MODEL=gpt-5.4-mini
PORT=8787
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

The default model is `gpt-5.4-mini` for a lower-latency planning experience. Use `gpt-5.5` if you want the flagship model.

## Local Run

```bash
npm install
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

The API runs at:

```text
http://127.0.0.1:8787/api
```

## How To Test

```bash
npm test
npm run build
```

## Verify Streaming

Start the server, then run:

```bash
npm run test:stream
```

This posts a real request to `/api/agent` and reads the SSE stream until it confirms:

- at least one `tool-progress` event
- at least one `text-delta` event

## Add A New Tool

1. Add a file in `src/agents/tools/`.
2. Export a pure function for local tests.
3. Wrap it with `tool({ name, description, parameters, execute })`.
4. Export it from `src/agents/tools/index.ts`.
5. Add it to `src/agents/babyPlannerAgent.ts`.
6. Mention when to use it in `src/agents/instructions.ts`.
7. Add focused tests in `src/tests/tools.test.ts`.

## Safety

Baby Planner provides planning support, not medical advice. It should not diagnose, prescribe, or replace a doctor, midwife, nurse, emergency service, or local health line. For urgent symptoms such as bleeding, reduced fetal movement, severe pain, fever, severe headache, vision changes, chest pain, shortness of breath, or emergency signs, contact a healthcare provider, labor and delivery unit, local health line, or emergency services right away.

## Privacy And Persistence

Planner data is stored locally in browser local storage. Account, session, and invite data is stored locally on the server in `work-auth/auth-db.json`. The local Express server sends planner context to the OpenAI API only when the user asks the Baby Planner agent a question. The app does not store pregnancy or health information on external services.

## Auth And Invites

Email/password sign-up and sign-in are real local server flows. Passwords are salted and hashed with PBKDF2, sessions use random HTTP-only cookies, and user/invite data is stored in `work-auth/auth-db.json`.

Google sign-in requires real OAuth credentials. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` first, then implement the callback route for your deployment domain.

## Deployment Notes

- Deploy the frontend and server together or proxy `/api` to the server.
- Keep `OPENAI_API_KEY` in server-side environment variables only.
- Use HTTPS in production.
- Replace local JSON auth storage with a production database before deploying for real users.
- Keep the medical disclaimer visible in product copy and agent instructions.
