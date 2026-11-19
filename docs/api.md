# API Reference

All endpoints return JSON. Routes are prefixed with `/api`, except for the health check.

Authentication uses an `httpOnly` session cookie set by `register` and `login`. Clients must send cookies with their requests (`credentials: 'include'` in `fetch`). In production the cookie is `SameSite=None; Secure` (HTTPS only); locally it is `SameSite=Lax`.

| Method | Endpoint                     | Auth     | Description                          |
| ------ | ---------------------------- | -------- | ------------------------------------ |
| GET    | `/health`                    | —        | Health check                         |
| POST   | `/api/auth/register`         | —        | Create an account and log in         |
| POST   | `/api/auth/login`            | —        | Log in                               |
| POST   | `/api/auth/logout`           | —        | Log out and delete the session       |
| GET    | `/api/auth/me`               | Required | Current user                         |
| GET    | `/api/cities`                | —        | Cities that have venues              |
| GET    | `/api/venues?city=`          | —        | List venues, optionally for one city |
| GET    | `/api/venues/:id`            | —        | Get a single venue by ID             |
| GET    | `/api/availability/:venueId` | —        | Upcoming time slots for a venue      |
| GET    | `/api/bookings`              | Required | The logged-in user's bookings        |
| GET    | `/api/owner/bookings`        | Owner    | Bookings at the owner's venues       |
| POST   | `/api/bookings`              | Required | Book a slot as the logged-in user    |
| PUT    | `/api/bookings/:id`          | Required | Update a booking's status            |

Unmatched routes return a `404` JSON response.

### `POST /api/auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "at-least-8-chars"
}
```

- `name`: required, up to 255 characters
- `email`: required, valid email (stored lowercased)
- `password`: required, 8 characters minimum, 72 bytes maximum (a bcrypt limit)

Returns `201` with `{ "user": { id, email, name, role, createdAt } }` and sets the session cookie. Returns `409` (`EMAIL_TAKEN`) if the email is already registered.

### `POST /api/auth/login`

Body: `{ "email": "...", "password": "..." }`. Returns `200` with `{ "user": ... }` and sets the session cookie, or `401` (`INVALID_CREDENTIALS`).

### `GET /api/venues`

Each venue looks like this:

```json
{
  "id": "10000000-0000-4000-8000-000000000001",
  "name": "Bowling Alley Downtown",
  "address": "100 Example Street",
  "city": "New York",
  "timezone": "America/New_York",
  "category": "Bowling",
  "description": "Classic lanes, shoe rental and a snack bar. Great for groups and birthdays.",
  "imageFile": "bowling-alley.jpg",
  "minPricePerSpot": 25
}
```

`imageFile` is only a file name; the frontend serves the image from its own `public/images/venues/` folder.

`minPricePerSpot` is the lowest price per spot among the venue's upcoming slots, or `null` if it has none. It is only in the list; `GET /api/venues/:id` returns the same venue without it.

### `GET /api/availability/:venueId`

Returns the venue's upcoming time slots (slots that have already started are left out) with computed availability:

```json
[
  {
    "id": "20000000-0000-4000-8000-000000000001",
    "time": "2026-11-02T15:00:00.000Z",
    "endTime": "2026-11-02T16:00:00.000Z",
    "price": 30,
    "available": true,
    "spotsRemaining": 4
  }
]
```

### `GET /api/bookings`

Returns `{ "bookings": [...] }` for the logged-in user. Each booking includes the venue and slot details needed to recognise it (`venueName`, `venueAddress`, `venueCity`, `venueTimezone`, `startTime`, `endTime`) and how many `spots` were booked. `price` is the price per spot.

### `POST /api/bookings`

Requires login. The customer's name and email come from the logged-in user. Request body:

```json
{
  "venueId": "10000000-0000-4000-8000-000000000001",
  "slotId": "20000000-0000-4000-8000-000000000001",
  "spots": 2
}
```

- `venueId`: required, valid UUID
- `slotId`: required, valid UUID
- `spots`: optional whole number, at least 1, default 1. It can't exceed the spots left in the slot. The slot's `price` is per spot, so the total is `price × spots`.

Returns `201` with `{ "booking": { ... } }` (status `pending`). Capacity is taken atomically in a transaction, so two people can't take the last spots. Returns `409` (`SLOT_FULLY_BOOKED`) if the slot is full, `409` (`NOT_ENOUGH_SPOTS`) if fewer spots are left than requested, `400` (`SLOT_ALREADY_STARTED`) if it has started, and `404` if the venue or slot doesn't exist.

### `GET /api/owner/bookings`

Requires the `owner` role (`403` otherwise). Returns `{ "bookings": [...] }` for the venues the owner owns, in the same shape as `GET /api/bookings` (including `customerName` and `customerEmail`). Pending bookings come first.

Every venue has exactly one owner (`venues.owner_id`, required), and one owner can have several venues. Owners are created in the database (the seed has a demo owner); there is no API for creating them.

### `PUT /api/bookings/:id`

Requires login. Request body:

```json
{
  "status": "cancelled"
}
```

`status` must be `confirmed` or `cancelled`. Every new booking starts as `pending`, and no caller can set a booking back to `pending`; sending `pending` returns `403` (`FORBIDDEN`).

Returns `200` with the updated `{ "booking": { ... } }`.

- Customers can only cancel their own bookings. Setting any other status returns `403` (`FORBIDDEN`). Another customer's booking returns `404`, the same as a missing one.
- Owners can confirm or cancel bookings at the venues they own. Bookings at other venues return `404`.
- `cancelled` is final and frees all of the booking's spots. Changing a cancelled booking, or setting the status it already has, returns `400` (`INVALID_STATUS_CHANGE`).
- A booking can't be confirmed once its slot has started (`400`, `SLOT_ALREADY_STARTED`). Cancelling is still allowed.

### `GET /health`

Returns `200` with `{ "status": "ok" }` when the server is running. It does not check the database.

### Errors

Every error response has a message and a stable code (`{ "error": "...", "code": "..." }`). Validation errors (`VALIDATION_FAILED`) also include a `details` array with the Zod issues.

| Status | When                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| 400    | Validation failed, invalid JSON, slot already started, or a status change not allowed |
| 401    | Not logged in, or invalid credentials                                                 |
| 403    | Logged in but not allowed to do this                                                  |
| 404    | Venue, slot, booking or route not found                                               |
| 409    | Slot fully booked, not enough spots left, or email already registered                 |
| 429    | Too many requests (`RATE_LIMITED`), see below                                         |
| 500    | Unexpected error (`INTERNAL_ERROR`)                                                   |

### Rate limiting

Requests are limited per IP address: 100 per minute across `/api`, and 10 per 15 minutes on `POST /api/auth/register` and `POST /api/auth/login`. `/health` is not limited. Over the limit, the API returns `429` with `RATE_LIMITED`. Responses carry `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers. Counters are kept in memory, so they reset on restart.

The full list of codes is in `src/errors.ts`.
