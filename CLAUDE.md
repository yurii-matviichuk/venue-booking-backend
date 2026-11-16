# Venue Booking API

REST API for a venue booking app. Venues offer time slots, each with a capacity and a price per spot. Customers browse venues by city, pick a slot and book spots; venue owners see and manage bookings at their own venues. Each booking is checked against the slot's capacity inside a SQL transaction, so concurrent bookings can't overbook a slot. It is a portfolio demo: all data is fictional.

## Commands

- `docker compose up -d` — start PostgreSQL; creates the tables from `src/db/schema.sql` on an empty volume
- `docker compose cp src/db/seed.sql postgres:/tmp/seed.sql` then `docker compose exec postgres psql -U venue_user -d venue_booking -f /tmp/seed.sql` — load sample data
- `docker compose down -v` — reset the database (deletes all data); needed after changing `schema.sql`

- `npm run dev` — run the server with hot reload (`tsx watch`)
- `npm test` — run the integration tests (PostgreSQL must be running)
- `npm run format:check` — check Prettier formatting

The pre-commit hook runs `npm run lint && npm run build`. It does not run Prettier or the tests.

## Structure

- `src/routes/` defines routes only; they are mounted in `src/app.ts`
- `src/middleware/` holds `requireAuth` and `requireRole`
- `src/controllers/` handles HTTP request and response, plus Zod validation
- `src/services/` holds business logic and all SQL; it must not import Express types
- `src/jobs/` holds background jobs (expired-session cleanup). Start them from `src/server.ts`, never `src/app.ts`, or tests would start the timers
- The seed has no bookings, only a demo customer and a demo owner who owns every venue

Keep this layering.

## Conventions

- Relative imports must end in `.js` (e.g. `import { createApp } from './app.js'`) even though the files are `.ts` (`NodeNext`).
- `import 'dotenv/config'` must stay the first import in `src/app.ts`: the pool in `src/db/connection.ts` reads `DATABASE_URL` when it loads.
- Use parameterized queries (`$1`, `$2`).
- Map snake_case columns to camelCase in the service's `to...` functions (`toBooking`, `toUser`), not in controllers.
- Add every new error to `errorDefinitions` in `src/errors.ts` (stable `code`, HTTP status, message) and throw `AppError` with that code. Error responses are `{ error, code, details? }`.
- Check path ids with `isUuid` before querying: Postgres throws on a malformed UUID. Treat a bad id as not found.
- `pg` returns `DECIMAL` columns (prices) as strings; convert them with `Number()`.
- A booking's customer name and email come from the logged-in user, never from the request body.
- Roles are `customer` and `owner`. Every venue has exactly one owner (`owner_id`, `NOT NULL`). Only `updateBookingStatus` decides who may set which status; keep that rule in the service, not in routes.
- Capacity is taken by one conditional `UPDATE` inside `withTransaction` (`services/booking.ts`) that adds the booking's `spots` to `booked` only if they fit, and cancelling gives all of them back under `FOR UPDATE`. A slot's `price` is per spot.
- The session cookie is `SameSite=None; Secure` in production (frontend and API on different domains) and `SameSite=Lax` locally.

## Things to avoid

- Don't put SQL in controllers.
- Don't build SQL strings from user input.
- Don't change an API response shape without updating the client that consumes it.
- Don't return 403 for another user's booking; return 404 so ids can't be probed.
- Don't weaken the booking transaction logic without keeping the concurrency test in `tests/bookings.test.ts` passing.
- Don't change `schema.sql` without updating `seed.sql` to match.
- Don't commit `.env` files or credentials.

## Environment

Copy `.env.example` to `.env` (gitignored). `DATABASE_URL` is required. `CLIENT_URL` (required in production) is the client origin allowed by CORS and must match exactly, including the port, or the session cookie is not sent.

## Testing

Integration tests live in `tests/` and run against a real PostgreSQL, because the booking rules live in SQL transactions. Don't mock the database.

- Tests use a separate database, `venue_booking_test` (override with `TEST_DATABASE_URL`). `tests/globalSetup.ts` creates it and rebuilds the tables from `schema.sql` on every run, and refuses to run if the name doesn't end in `_test`.
- Test files share one database and run one after another. Call `resetDb()` in `beforeEach`.
- Reuse the helpers in `tests/helpers.ts` instead of writing setup by hand.
- `tests/` is not covered by `tsc` (outside `tsconfig.json`'s `include`); ESLint and Prettier do cover it.

## Known limitations

- Owners can only be created in the database (the seed has a demo owner); there is no API or UI for creating them.
- No migration tooling: a schema change means resetting the database. `src/db/migrations/` is empty.
