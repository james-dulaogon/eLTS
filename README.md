# eLTS
The eLegislative Tracking System (eLTS) to digitize and automate document workflows for local legislative offices. The system transitions static record-keeping into a high-performance tracking matrix by mapping the complete journey of measures—from raw intake documents and committee hearings to finalized ordinances and resolutions.

## Project structure

- `backend/` contains the Express API, PostgreSQL pool configuration, and server code.
- `frontend/` contains the React, TypeScript, Vite, and Tailwind application.
- `docker-compose.yml` runs PostgreSQL, the API, and the frontend together.

## Run locally

Copy `.env.example` to `.env` and update its local database values if needed. Install dependencies in `backend/` and `frontend/` with `npm install`, then start each app in its own terminal using `npm run dev`. The frontend runs on Vite's default port, and `/api` requests are proxied to the API on port 3000.

## Run with Docker Compose

From the repository root, run `docker compose up --build`. The frontend is available at `http://localhost:8080` by default. Override `FRONTEND_PORT` in `.env` to use a different host port. The `.env` file is ignored by Git; use `.env.example` as the shareable template.
