# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the server with hot reload via `tsx` (reads `src/index.ts` directly, no build step)
- `npm run build` — type-check and compile to `dist/` via `tsc`
- `npm start` — run the compiled server from `dist/index.js` (requires `npm run build` first)
- There is no test suite yet (`npm test` is a placeholder that exits with an error)
- Server port is read from `PORT` env var (`.env`), defaulting to 5001

## Architecture

This is a Node.js/Express REST API for booking venues (bowling alleys, darts lounges, etc.), written in TypeScript with ESM modules (`"type": "module"` in package.json, `module`/`moduleResolution` set for bundler-style ESM in tsconfig).

The application follows a **layered architecture** for clean separation of concerns:

1. **Routes** (`src/routes/`) — Express Router definitions; route mounting happens in `src/index.ts`
2. **Controllers** (`src/controllers/`) — HTTP request/response handling; Zod validation of request bodies and parameters
3. **Services** (`src/services/`) — Pure business logic; independent of HTTP; handles core operations like booking creation, status updates, and availability computation
4. **Types** (`src/types/models.ts`) — Centralized domain type definitions (TypeScript types, not runtime values)
5. **Validation** (`src/validation/schemas.ts`) — Zod schemas for request validation
6. **Data** (`src/data/mockData.ts`) — In-memory mock data storage (venues, time slots); no database; data resets on restart

Domain model:

- **Venue**: `id`, `name`, `location`, `timezone`
- **TimeSlot**: `id`, `venueId`, `startTime`/`endTime` (ISO 8601), `price`, `capacity`, `booked` (count)
- **Booking**: created on demand from a venue + slot + customer info, with a `status` of `pending` | `confirmed` | `cancelled`

Routes (all under `/api` except `/health`):

- `GET /health` — liveness check
- `GET /api/venues` — list venues
- `GET /api/venues/:id` — single venue
- `GET /api/availability/:venueId` — time slots for a venue, derived from `timeSlots` filtered by `venueId`, with `available`/`spotsRemaining` computed from `capacity - booked`
- `POST /api/bookings` — create a booking; Zod validates required fields; service layer validates slot capacity
- `PUT /api/bookings/:id` — update a booking's status; Zod validates against `pending`/`confirmed`/`cancelled` enum; service layer validates booking exists
- Unmatched routes fall through to a catch-all 404 JSON handler in `src/index.ts`

Error handling:

- **400 Bad Request** — validation errors (Zod) or business logic constraints (e.g., slot fully booked)
- **404 Not Found** — resource not found (booking, slot, or venue does not exist)
- **500 Internal Server Error** — unexpected errors caught by global error middleware

Development setup:

- **Husky** (`npm prepare` script) automatically installs git hooks
- **Pre-commit hook** (`.husky/pre-commit`) runs `npm run lint && npm run build` before each commit
- **Prettier** is configured but runs on-save in VS Code (not in pre-commit hook) to keep startup fast
- **TypeScript** is in `devDependencies` (development/build-time only)
