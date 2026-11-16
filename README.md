# Venue Booking Backend

A Node.js/Express REST API for booking time slots at entertainment venues (bowling alleys, darts lounges and similar). Customers book spots in a slot, and venue owners manage bookings at their own venues. Written in TypeScript with ESM modules.

**What it shows**

- Bookings are checked against slot capacity in a single SQL transaction, so concurrent requests can't overbook a slot.
- Role-based access: customers and owners see only their own data, and other users' bookings return 404.
- Session auth with bcrypt password hashing and `httpOnly` cookies.
- Integration tests run against a real PostgreSQL database, not mocks.

> **Demo app:** This is a portfolio project. All venues, addresses, time slots and bookings are fictional, and no emails are sent. Please don't enter real personal data when registering.

## Demo accounts

Anyone can browse venues and available time slots without an account. To book a slot or view bookings, log in with a seeded account (or register your own):

| Role     | Email               | Password        | Can do                                               |
| -------- | ------------------- | --------------- | ---------------------------------------------------- |
| Customer | `demo@example.com`  | `demo-password` | Book slots, view and cancel own bookings             |
| Owner    | `owner@example.com` | `demo-password` | See bookings at their venues, confirm or cancel them |

The demo owner owns every seeded venue, so a booking made as the customer can be confirmed by the owner.

You can also register your own account with `POST /api/auth/register`. Use made-up details: no verification emails are sent, and accounts are stored in this demo's database.

## Requirements

- Node.js `^22.13.0 || >=24.0.0` (required by ESLint 10)
- npm (included with Node.js)
- Git (Husky installs its git hooks during `npm install`)
- PostgreSQL 16 (the Docker setup uses `postgres:16-alpine`)
- Docker with Compose v2 (`docker compose`), to run PostgreSQL locally. Not needed if you point `DATABASE_URL` at your own PostgreSQL server.

## Tech Stack

- **Express 5** — REST API framework
- **TypeScript** — Type-safe development
- **PostgreSQL** (`pg`) — Data storage
- **Zod** — Runtime request validation
- **bcrypt** — Password hashing
- **cookie-parser** — Reads the session cookie
- **Cors** — Cross-origin resource sharing for the frontend
- **Dotenv** — Environment variable management
- **ESLint, Prettier, Husky** — Linting, formatting and pre-commit checks
- **Vitest, Supertest** — Integration tests against a real PostgreSQL database

## Setup

Clone the repository and go into its folder:

```bash
git clone https://github.com/yurii-matviichuk/venue-booking-backend.git
cd venue-booking-backend
```

Next, create a `.env` file in the project root by copying `.env.example`. The `.env` file holds the database URL and the frontend origin the server reads at startup. Use the command for your terminal:

- **macOS, Linux, Git Bash or WSL:** `cp .env.example .env`
- **Windows Command Prompt:** `copy .env.example .env`
- **Windows PowerShell:** `Copy-Item .env.example .env`

You can also duplicate `.env.example` in your editor or file manager and rename the copy to `.env`.

Then run the remaining commands:

```bash
npm install
docker compose up -d
# then run `docker compose ps` and wait until the postgres row's STATUS shows `(healthy)`
# (this takes about 10-20 seconds; `health: starting` means it isn't ready yet)
docker compose cp src/db/seed.sql postgres:/tmp/seed.sql
docker compose exec postgres psql -U venue_user -d venue_booking -f /tmp/seed.sql
```

Then start the server with `npm run dev` (see [Development](#development)).

To reset the database, run `docker compose down -v` and then repeat the `docker compose up -d` and seed steps.

## Development

Run the server in development mode with hot reload:

```bash
npm run dev
```

Build and run for production:

```bash
npm run build
npm start
```

Once running, the API is available at `http://localhost:5001` (or your configured `PORT`).

This repository contains only the API. The web frontend is a separate project. It runs on `http://localhost:5173` by default, which matches the `CLIENT_URL` default in `.env.example`.

### Scripts

| Script                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Run the server with hot reload via `tsx`      |
| `npm run build`        | Type-check and compile TypeScript to `dist/`  |
| `npm start`            | Run the compiled server from `dist/server.js` |
| `npm run lint`         | Run ESLint checks                             |
| `npm run lint:fix`     | Auto-fix ESLint issues                        |
| `npm run format`       | Format code with Prettier                     |
| `npm run format:check` | Check Prettier formatting                     |
| `npm test`             | Run the tests once (needs PostgreSQL running) |

### Tests

```bash
docker compose up -d   # PostgreSQL must be running
npm test
```

The tests are integration tests: they call the real Express app with Supertest and a real PostgreSQL database, because the booking rules (capacity, cancelling, permissions) live in SQL transactions. They run against their own `venue_booking_test` database, which is created and rebuilt automatically, so your development data is never touched. Set `TEST_DATABASE_URL` to use another server.

### Pre-commit Hooks

Husky runs `npm run lint && npm run build` before each commit, and blocks the commit if either fails. It doesn't run Prettier or the tests, so run `npm run format:check` and `npm test` yourself before pushing.

## API Reference

See [docs/api.md](docs/api.md) for the endpoints, request and response shapes, and error codes.

For how the tricky booking rules work (availability check, concurrent bookings, cancelling, who can see which bookings), see [docs/design-notes.md](docs/design-notes.md).

### Deployment notes

- Set `NODE_ENV=production` and `CLIENT_URL` (the server refuses to start without it). `CLIENT_URL` must match the frontend origin exactly, including the port.
- In production the session cookie is `SameSite=None; Secure`, so the frontend and API can live on different domains, but both must be served over HTTPS.
- `GET /health` returns `200` while the server is running, so it works as a platform health check. It does not check the database.

## Project Structure

```
src/
├── app.ts          # Express app setup, route mounting, 404 and error handlers
├── server.ts       # Entry point: starts the HTTP server
├── errors.ts       # AppError and the list of API error codes
├── routes/         # Route definitions (auth, bookings, owner, venues, cities, availability, health)
├── middleware/     # requireAuth and requireRole: reject requests without the right user
├── controllers/    # HTTP request/response handling, with Zod validation
├── services/       # Business logic, independent of HTTP
├── jobs/           # Background jobs started from server.ts (hourly expired-session cleanup)
├── validation/     # Zod schemas for API requests
├── types/          # Domain types (Venue, TimeSlot, Booking, User, etc.)
└── db/             # PostgreSQL pool, schema.sql, seed.sql
tests/              # Vitest + Supertest integration tests
```

Requests flow through the layers in this order: route → controller → service → database.

### Known limitations

- **No migrations.** The schema is a single snapshot, so a schema change means resetting the database (see [Setup](#setup)).
- **Owner accounts are created in the database.** There's no API or frontend flow for creating owners. The seed includes a demo owner you can use (see [Demo accounts](#demo-accounts)).
- **No frontend in this repository.** The API is documented in [docs/api.md](docs/api.md) and can be called with any HTTP client.
