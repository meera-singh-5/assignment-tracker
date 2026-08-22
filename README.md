# Assignment Tracker

A desktop application that scans your Gmail for assignment notifications from educational platforms (Canvas, Blackboard, Gradescope, WebAssign, Pearson, Brightspace, Google Classroom, and more), parses them into structured assignments, and helps students track their coursework and deadlines across multiple classes, platforms, and Google accounts.

## Features

- **Sign-in with Google**: Sign in with Google to allow Assignment Tracker to accurately scan and log assignments
- **To-Do View**: See all active assignments with time remaining and overdue indicators
- **Calendar View**: Visualize assignment due dates on a monthly calendar, color coded by course
- **Assignment Management**: Manually add, complete, and edit assignments from multiple courses
- **Status Tracking**: Monitor active and completed assignments with clear visual indicators

<img width="1197" height="1008" alt="image" src="https://github.com/user-attachments/assets/b4b68b5f-7474-4a86-9e99-8d10e98242c8" />

<img width="1202" height="1008" alt="image" src="https://github.com/user-attachments/assets/89cc77d8-b060-4998-8818-2ca4d0d9498e" />

### To-Do Dashboard
View all active assignments with:
- Time remaining counters
- Overdue alerts
- Course and platform tags
- Quick completion checkboxes

### Calendar View
Monthly calendar showing:
- Assignment due dates marked with colored dots
- Multiple assignments per day support
- Easy navigation between months

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

### Allowing non-NYU accounts to sign in

Under **APIs & Services → OAuth consent screen**, the **User Type** setting controls who can sign in:

- **Internal** — restricted to accounts within your Google Workspace organization (e.g. `@nyu.edu`). This is the default and is why non-NYU accounts get an "org_internal" error.
- **External + Testing** (recommended for small groups) — switch User Type to External, leave publishing status as Testing, and add each non-NYU Google account under **Test users** (up to 100). Those accounts can sign in immediately with no review process.
- **External + Published to Production** — allows any Google account to sign in without being pre-listed. Because this app requests the `gmail.readonly` scope, which Google classifies as "restricted," publishing to production generally requires Google's OAuth verification process (privacy policy URL, possibly a demo video, and a CASA security assessment), which can take days to weeks.

## Installation

```bash
# Clone the repository
git clone https://github.com/meera-singh-5/assignment-tracker.git
cd assignment-tracker

# Install dependencies
npm install

# Configure environment variables
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

## Configuration

Update settings to customize:
- Connected learning platforms
- Notification preferences
- Display options

## Future Enhancements

- [ ] Push notifications for upcoming deadlines
- [ ] Mobile app version
- [ ] Export to calendar applications
- [ ] Import from calendar options

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

email: ms16082@nyu.edu
