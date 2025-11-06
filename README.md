# Smart Chat App

A full-featured, multi-threaded real-time chat application built with React + TypeScript (Vite) on the frontend and Node.js + Express + Socket.io on the backend. This project was created as a demo/portfolio piece and includes several advanced features designed to demonstrate system design and engineering skills (real-time transport, group chat, audio/photo messaging, local persistence, and a small set of OS-inspired scheduling/data structures for instrumentation).

If you're preparing this repository for an interview or portfolio, this README gives a concise project summary, architecture notes, and clear setup/run instructions so reviewers can boot the app locally quickly.

---

Table of contents
- Features
- Quick demo / resume blurb
- Architecture & key components
- Getting started (dev)
- Production / build
- Tests & manual testing checklist
- Notes, tips & next steps
- Contributing
- License

---

## Features

- Real-time one-to-one and group chat using Socket.io
- Image sharing (inline preview)
- Voice messages (record, play, download)
- Local persistence of threads/messages in the browser (7-day retention filter)
- Create groups with member selection and group threads
- Quick Broadcast / Announcement feature to send prioritized announcements to groups/online users
- OS-inspired backend components for demo purposes:
	- Priority message queue
	- LRU thread cache
	- Connection semaphore
	- Round-robin scheduler
	- Deadlock detector
- OS Stats dashboard showing live metrics emitted from the server
- Desktop notifications for incoming messages

## Quick demo / resume blurb

Smart Chat App — a real-time chat system demonstrating a modern full-stack architecture with features commonly asked for in interview demos: reliable real-time messaging, multimedia messages (images/voice), group management, persistence, and instrumentation. The backend includes simple OS-like scheduling/data-structure modules (priority queue, LRU cache, semaphore and scheduler) which are surfaced to the frontend for live visualization and explanation during demos.

Use this project to showcase: WebSockets (Socket.io), TypeScript across frontend and backend, local persistence strategies, media capture in the browser, and system-level instrumentation for load/scheduling demonstrations.

## Architecture & key components

- Frontend: `frontend/` — React + TypeScript + Vite. Key pages:
	- `pages/ChatApp.tsx` — chat UI and message handling
	- `pages/Dashboard.tsx` — dashboard, groups, quick actions (announcement)
	- `pages/OSStats.tsx` — live visualization of backend OS-style metrics
- Backend: `backend/` — Node.js + Express + Socket.io (TypeScript). Key files:
	- `backend/app.ts` — express server and socket initialization
	- `backend/utils/initSocket.ts` — socket event handlers and in-memory stores (users, threads, groups)
	- `backend/utils/*` — small OS-inspired modules (priority queue, LRU cache, semaphore, round-robin, deadlock detector)

Data flow: All real-time comms occur over Socket.io. The server keeps ephemeral in-memory state for threads/groups for demo purposes; the client keeps a local copy of threads/messages in localStorage so the UI remains demo-friendly offline/refresh-safe.

## Getting started (development)

Prerequisites

- Node.js (v18+ recommended)
- npm (or yarn)

1) Clone the repository (if you haven't already)

```powershell
git clone https://github.com/REHAAANNN/smart-chat-app.git
cd smart-chat-app
```

2) Install dependencies

Open two terminal windows (one for the backend, one for the frontend).

Backend:

```powershell
cd backend
npm install
```

Frontend:

```powershell
cd frontend
npm install
```

3) Environment variables

The backend reads two environment variables from `.env` (optional):

- `PORT` — backend port (default: `5000`)
- `CLIENT_URL` — allowed frontend origin for CORS (default: `http://localhost:5173`). If Vite runs on port 5174 on your machine, set `CLIENT_URL=http://localhost:5174`.

Create `.env` at the `backend/` folder if you want to override defaults. Example:

```text
PORT=5000
CLIENT_URL=http://localhost:5173
```

4) Run the app

In the backend terminal:

```powershell
cd backend
npm run dev
```

In the frontend terminal:

```powershell
cd frontend
npm run dev
```

Open your browser at the address printed by Vite (usually http://localhost:5173). To test multi-client behavior, open a second browser (or an incognito window) and sign in/connect another user.

## Production / build

Build the frontend with:

```powershell
cd frontend
npm run build
```

The backend is TypeScript-based and uses `ts-node`/`nodemon` for development. For production you should compile TypeScript, add a proper persistence layer (database), and run the backend under a process manager (pm2/systemd) or containerize it.

## Tests & manual checklist

There are no automated tests included. Recommended manual test flow for a demo:

- Start backend and frontend locally (see Getting started)
- Open two browser contexts, connect two users
- Verify:
	- Real-time text messages deliver both ways (no duplicates)
	- Sending images displays inline
	- Record a voice message, playback and click download to verify file
	- Create a group from Dashboard -> ensure it appears for members
	- Send an Announcement from Dashboard -> recipients should receive the announcement thread
	- Open OS Stats panel and observe live metrics when messages are sent (priority queue, scheduler updates)

## Notes, tips & next steps

- Persistence: currently the backend keeps threads/groups in-memory for demo simplicity. Add a database (Postgres / Mongo) to persist data across restarts.
- Security: signing and permission checks for broadcasts/announcements are intentionally permissive in the demo; add auth and role checks for production.
- Repo cleanup: this repository currently contains generated `node_modules` inside subfolders. Before publishing for a clean repo consider adding a `.gitignore` and removing `node_modules` from the git history (or re-creating the repo with node_modules excluded) to reduce repo size.

## Contributing

Contributions are welcome. If you'd like me to help clean history, add a `.gitignore`, or split the big commit into smaller logical commits for a cleaner Git history, tell me and I will help.

## License

This project is provided as-is for demo and learning purposes. If you'd like a license, MIT is a common choice. Example header:

```
MIT License
```

---

If you want, I can:

- Add a polished `README` summary as a short paragraph to use in your CV or GitHub profile (resume bullet/paragraph).
- Create a `.gitignore` and remove `node_modules` from the repo history to slim the repo.
- Add a small `DEPLOY.md` with Docker and Azure/GitHub Actions steps.

Tell me which you'd like next and I will make the changes.
