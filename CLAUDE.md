# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the server with hot reload via `tsx` (reads `src/server.ts` directly, no build step)
- `npm run build` — type-check and compile to `dist/` via `tsc`
- `npm start` — run the compiled server from `dist/server.js` (requires `npm run build` first)
- There is no test suite yet (`npm test` is a placeholder that exits with an error)
- Server port is read from `PORT` env var (`.env`), defaulting to 5001

## Architecture

This is a Node.js/Express REST API for booking venues (bowling alleys, darts lounges, etc.), written in TypeScript with ESM modules (`"type": "module"` in package.json, `module`/`moduleResolution` set to `NodeNext` in tsconfig). Because of `NodeNext`, relative imports must include the `.js` extension (e.g. `import { createApp } from './app.js'`) even though the source files are `.ts`; `tsc` rejects a missing extension, and plain Node would fail to load it at runtime.

The application follows a **layered architecture** for clean separation of concerns:

1. **Routes** (`src/routes/`) — Express Router definitions; route mounting happens in `src/app.ts`
2. **Controllers** (`src/controllers/`) — HTTP request/response handling; Zod validation of request bodies and parameters
3. **Services** (`src/services/`) — Pure business logic; independent of HTTP; handles core operations like booking creation, status updates, and availability computation
4. **Types** (`src/types/models.ts`) — Centralized domain type definitions (TypeScript types, not runtime values)
5. **Validation** (`src/validation/schemas.ts`) — Zod schemas for request validation
6. **Database** (`src/db/`) — PostgreSQL via `pg`; `schema.sql` creates tables, `seed.sql` loads dev sample data (run it separately; future-dated slots needed for the demo)

Domain model:

- **Venue**: `id`, `name`, `location`, `city`, `timezone`
- **TimeSlot**: `id`, `venueId`, `startTime`/`endTime` (ISO 8601), `price`, `capacity`, `booked` (count)
- **Booking**: created by a logged-in user for a venue + slot, with a `status` of `pending` | `confirmed` | `cancelled`

Routes (all under `/api` except `/health`):

- `GET /health` — liveness check
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — cookie-session auth (`me` requires login)
- `GET /api/cities` — cities that have venues (public)
- `GET /api/venues?city=` — list venues, optionally for one city (public)
- `GET /api/venues/:id` — single venue (public)
- `GET /api/availability/:venueId` — upcoming time slots for a venue with `available`/`spotsRemaining` (public)
- `GET /api/bookings` — the logged-in user's bookings as `{ bookings }` (requires login)
- `POST /api/bookings` — book a slot as the logged-in user; capacity is taken atomically in a transaction
- `PUT /api/bookings/:id` — update status; customers may only cancel their own booking, admins may set any status; cancelled is final and frees the spot
- Unmatched routes fall through to a catch-all 404 JSON handler in `src/app.ts`

Error handling:

- **400 Bad Request** — validation errors (Zod) or invalid actions (e.g., slot already started)
- **401/403** — not logged in / not allowed
- **409 Conflict** — slot fully booked, email already registered
- **404 Not Found** — resource not found (booking, slot, or venue does not exist)
- **500 Internal Server Error** — unexpected errors caught by global error middleware

Development setup:

- **Husky** (`npm prepare` script) automatically installs git hooks
- **Pre-commit hook** (`.husky/pre-commit`) runs `npm run lint && npm run build` before each commit
- **Prettier** is configured but runs on-save in VS Code (not in pre-commit hook) to keep startup fast
- **TypeScript** is in `devDependencies` (development/build-time only)
