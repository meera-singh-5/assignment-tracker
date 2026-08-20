# Assignment Tracker

A desktop app that scans your Gmail for assignment notifications from educational platforms (Canvas, Blackboard, Gradescope, WebAssign, Pearson, Brightspace, Google Classroom, and more), parses them into structured assignments, and tracks them in a to-do list and calendar. Supports multiple Google accounts.

## Architecture

The app is an Electron + React desktop application:

- **Renderer (`src/`)** — a React + TypeScript UI (Vite-bundled, Tailwind CSS, Zustand for state) rendering the to-do list, calendar, and settings views. It talks to the main process only through the `window.electron` IPC bridge exposed by the preload script — it never touches Google APIs or the database directly.
- **Main process (`electron/`)** — Node/Electron backend that owns all privileged work:
  - `main.ts` — creates the app window and registers IPC handlers (`auth:*`, `gmail:*`, `tasks:*`, `db:*`, `settings:*`).
  - `preload.ts` — exposes a safe, typed IPC API to the renderer (`contextIsolation` is on, `nodeIntegration` is off).
  - `services/auth.ts` + `config/oauth.ts` — Google OAuth2 login/logout and multi-account session management.
  - `services/gmail.ts` — scans/refreshes Gmail messages via the Gmail API and hands raw emails to the parsers.
  - `services/parsers/*.ts` — one parser per educational platform that extracts assignment title/course/due date from email content, falling back to `generic.ts` for unrecognized formats.
  - `services/tasks.ts` — imports items from Google Tasks as assignments.
  - `services/database.ts` — a local SQLite database (via `better-sqlite3`) storing assignments, courses, settings, cached emails, and connected accounts. The DB file lives in the OS user-data directory, so all data stays on-device.
- **Build output** — Vite compiles the renderer to `dist/`, and `tsc` compiles the Electron/Node code to `dist-electron/`; `electron-builder` packages both into a distributable app.

Data flow: Renderer → IPC → Main process service → Gmail/Tasks API or SQLite → IPC response → Renderer state (Zustand) → UI.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A Google Cloud project with OAuth 2.0 credentials (see below) — required for Gmail/Tasks/Calendar access

### Setting up Google OAuth credentials

1. Create (or reuse) a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API**, **Google Calendar API**, and **Google Tasks API**.
3. Under **APIs & Services → Credentials**, create an **OAuth 2.0 Client ID** of type "Desktop app" (or "Web application" with the redirect URI below).
4. Add `http://127.0.0.1:8234/oauth/callback` as an authorized redirect URI.
5. Note the generated Client ID and Client Secret.

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
```

Edit `.env` and fill in your Google OAuth credentials:

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Running the app

**Development mode** (hot-reloading Vite + watched TypeScript compile + Electron):

```bash
npm run dev
```

**Type-check only:**

```bash
npm run typecheck
```

**Production build** (compiles renderer + main process into `dist/` and `dist-electron/`):

```bash
npm run build
```

**Package as a distributable app** (runs the build, then `electron-builder`):

```bash
npm run package
```

On first launch, use the in-app login flow to authorize a Google account — this opens a browser window for OAuth consent, then the app scans your Gmail for assignment emails and stores parsed results in a local SQLite database.
