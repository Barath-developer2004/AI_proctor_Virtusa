# Jatayu AI Proctor — Setup & Run

This repo contains:
- **`frontend/`**: Next.js app (candidate + admin UI)
- **`backend/`**: Go (Fiber) API + WebSocket telemetry
- **`extension/`**: Chrome extension to monitor tab/window focus + capture keystrokes/devtools/clipboard

## Prerequisites

- **Node.js**: 20+
- **Go**: 1.22+
- **Docker Desktop** (recommended): for Postgres + Redis (or everything via compose)
- **Chrome** (or Chromium): to load the `extension/`

You’ll also need a **Gemini API key** for the Socratic assessment + Saboteur.

## Quick start (recommended): Docker Compose

From the repo root:

```bash
docker compose up --build
```

Then open:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/health`

### Environment variables (Compose)

Compose reads these from your shell environment:
- **`GEMINI_API_KEY`** (required for AI)
- **`JWT_SECRET`** (optional; default in compose is fine for local demo)

Example (PowerShell):

```powershell
$env:GEMINI_API_KEY="YOUR_KEY_HERE"
docker compose up --build
```

## Local dev (without Docker for app code)

### 1) Start Postgres + Redis

Option A (recommended): run only dependencies in Docker:

```bash
docker compose up postgres redis
```

Option B: install Postgres + Redis locally and point `backend/.env` to them.

### 2) Backend (Go API)

In one terminal:

```bash
cd backend
go mod tidy
go run ./cmd/server
```

Backend runs on `http://localhost:8080` and auto-migrates tables on startup.

If you’re running Postgres/Redis locally, ensure `backend/.env` has:
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/jatayu_proctor?sslmode=disable`
- `REDIS_URL=redis://localhost:6379`
- `JWT_SECRET=...`
- `GEMINI_API_KEY=...`

### 3) Frontend (Next.js)

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Load & test the Chrome extension (proctoring)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the repo folder `extension/`

The extension is configured to run on:
- `http://localhost:3000/*`

### What to test

During an active exam session (CODING phase):
- **Tab switch** should increment violations
- **Switching away from the browser window** should increment violations
- **Opening DevTools** should increment violations
- **Copy/Paste** should increment violations
- **Typing** should stream keystroke deltas to the backend via WebSocket (used for cadence/rhythm)

## Demo flow (what to click)

1. Open `http://localhost:3000`
2. **Register an admin**
   - Go to `/register`
   - Use role `admin` (or register normally and update DB role; easiest: register via API with `"role":"admin"` if your UI supports it)
3. Login as admin → `/admin`
4. Create an exam (title/prompt/etc.)
5. Register/login as candidate → `/dashboard`
6. Start exam → `/exam/:sessionId`
7. Write code → click **Submit Code**
   - App transitions to **SOCRATIC** and the AI starts questioning
8. Complete Socratic rounds → continue to **SABOTEUR**
9. Fix code within 60 seconds → submit
10. See final **Integrity Score** results

## Useful commands

### Backend

```bash
cd backend
go test ./...
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm start
```

## Troubleshooting

- **AI errors / Socratic not responding**: set `GEMINI_API_KEY` (in env or `backend/.env`) and restart backend.
- **Extension not firing**: confirm it’s loaded and enabled, and you’re on `http://localhost:3000`.
- **Telemetry missing**: ensure you’re in CODING phase and backend is reachable at `http://localhost:8080`.

