# Design notes

How the trickier booking rules work and why they are written the way they are. The code is in `src/services/booking.ts`; the endpoints are in [api.md](api.md).

## 1. Availability check and capacity

A slot has a `capacity` and a `booked` counter. Booking `n` spots is one conditional `UPDATE` (`createBooking`):

```sql
UPDATE time_slots SET booked = booked + $3
WHERE id = $1 AND venue_id = $2
  AND booked + $3 <= capacity
  AND start_time > CURRENT_TIMESTAMP
RETURNING price
```

The check and the write happen in the same statement. There is no "read the free spots, then write" step, so nothing can change in between.

If the `UPDATE` touches no row, a second `SELECT` finds out why, so the client gets a precise error:

| Situation                                       | Error                  | Status |
| ----------------------------------------------- | ---------------------- | ------ |
| Slot doesn't exist, or belongs to another venue | `SLOT_NOT_FOUND`       | 404    |
| Slot has already started                        | `SLOT_ALREADY_STARTED` | 400    |
| No spots left                                   | `SLOT_FULLY_BOOKED`    | 409    |
| Some spots left, but fewer than requested       | `NOT_ENOUGH_SPOTS`     | 409    |

Notes:

- A booking takes all of its `spots` or none. Asking for more than are left changes nothing.
- The price is per spot. The booking response carries the slot's price, read in the same `UPDATE ... RETURNING`.
- `slotId` must belong to `venueId`. The `venue_id = $2` condition stops a slot from being booked through another venue's URL.

## 2. Concurrent bookings

Two people booking the last spots at the same moment must not both succeed. This is guaranteed by two things working together:

- **The row lock taken by `UPDATE`.** Postgres locks the slot row while the first `UPDATE` runs. The second one waits, then re-evaluates `booked + $3 <= capacity` against the new value and matches nothing.
- **`withTransaction`.** The `UPDATE` and the `INSERT` into `bookings` run in one transaction (`BEGIN` / `COMMIT`, `ROLLBACK` on any error). If the insert fails, the spots are not left taken.

Don't split the check and the write into separate queries, and don't move the capacity check into JavaScript. That brings back the race. The tests `never overbooks when many people book the last spot at once` and `never overbooks when groups book at once` in `tests/bookings.test.ts` must keep passing.

## 3. Cancelling and giving spots back

`updateBookingStatus` runs in a transaction and starts by selecting the booking with `FOR UPDATE OF b`. This locks the booking row, so two simultaneous cancels are serialized: the second one sees the status `cancelled` and fails with `INVALID_STATUS_CHANGE`, instead of giving the spots back twice.

- Cancelling subtracts the booking's full `spots` from the slot's `booked`.
- A cancelled booking is final. Nobody can confirm or re-cancel it, not even the venue owner.
- Cancelling is still allowed after the slot has started. Confirming is not (`SLOT_ALREADY_STARTED`).

## 4. Who can see and change what

A booking belongs to the user who made it (`bookings.user_id`) and to the owner of its venue (`venues.owner_id`).

- `GET /api/bookings` returns only the logged-in user's bookings.
- `GET /api/owner/bookings` returns bookings at venues the logged-in owner owns, pending ones first.
- The two lists are separate queries. An owner who books a slot at their own venue sees that booking in both.

Status changes (`updateBookingStatus`) are decided in one place, the service:

| Who                               | Can set                  |
| --------------------------------- | ------------------------ |
| The customer who made the booking | `cancelled`              |
| The owner of the booking's venue  | `confirmed`, `cancelled` |
| Anyone else                       | nothing (404)            |

Asking for a status you aren't allowed to set (for example a customer confirming their own booking) returns `FORBIDDEN` (403).

**Other people's bookings return 404, not 403.** A booking you can't access looks exactly like one that doesn't exist (`BOOKING_NOT_FOUND`), so ids can't be probed to find out which ones exist. The 403 above applies only to a booking you _can_ access when you ask for a status you may not set.

## 5. Sessions and cleanup

Expired sessions are rejected on every lookup (`findUserBySessionToken` only matches `expires_at > now`), so an expired token never works even while its row still exists. The rows are deleted by a background job (`src/jobs/sessionCleanup.ts`), started from `server.ts`. It purges once at startup and then hourly. The startup run matters because a host that restarts more often than hourly would otherwise never reach the first timer tick. With several instances each one purges, which is redundant but harmless.

## 6. Smaller gotchas

- **Customer name and email** come from the logged-in user, never from the request body. A name or email sent in the body is ignored.
- **Malformed ids.** Postgres throws on a malformed UUID, so ids are checked with `isUuid` before querying, and a bad id is treated as not found.
- **Prices.** `pg` returns `DECIMAL` columns as strings. The `to...` mappers convert them with `Number()`.
- **Column names.** The service's `to...` functions map snake_case columns to camelCase. Controllers never do this.
