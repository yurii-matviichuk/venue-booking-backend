# Venue Booking Backend

A Node.js/Express REST API for booking venues (bowling alleys, darts lounges, and similar entertainment venues). Written in TypeScript with ESM modules.

> **Note:** This project is currently a prototype. Venues, time slots, and bookings are all stored in in-memory mock data — nothing is persisted to a database, and data resets on every server restart.

## Requirements

- Node.js 16+
- npm

## Tech Stack

- **Express** — REST API framework
- **TypeScript** — Type-safe development
- **Zod** — Runtime request validation
- **Cors** — Cross-origin resource sharing
- **Dotenv** — Environment variable management

## Setup

```bash
npm install
```

This will automatically install dependencies and set up git hooks via Husky.

Create a `.env` file in the project root to configure the port (optional, defaults to `5001`; see `.env.example`):

```
PORT=5001
```

## Development

### Pre-commit Hooks

This project uses **Husky** to automatically run checks before each commit:

- **ESLint** — Code quality and style checks
- **TypeScript** — Type-checking and compilation

If your code has issues, the commit will be blocked until you fix them. You can manually fix ESLint issues by running:

```bash
npm run lint:fix
```

### Available Commands

```bash
npm run dev              # Start development server with hot reload
npm run build            # Type-check and compile TypeScript
npm run lint             # Run ESLint checks
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check Prettier formatting
npm start                # Run production server (requires npm run build first)
```

## Usage

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

## API Reference

All endpoints return JSON. Routes are prefixed with `/api`, except for the health check.

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/health`                 | Liveness check                       |
| GET    | `/api/venues`             | List all venues                      |
| GET    | `/api/venues/:id`         | Get a single venue by ID             |
| GET    | `/api/availability/:venueId` | Get available time slots for a venue |
| POST   | `/api/bookings`           | Create a booking                     |
| PUT    | `/api/bookings/:id`       | Update a booking's status            |

### `GET /api/availability/:venueId`

Returns time slots for the venue with computed availability:

```json
[
  {
    "id": "slot-1",
    "time": "2024-01-15T10:00:00Z",
    "price": 30,
    "available": true,
    "spotsRemaining": 4
  }
]
```

### `POST /api/bookings`

Request body (all fields required):

```json
{
  "venueId": "1",
  "slotId": "slot-1",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com"
}
```

**Validation rules:**
- `venueId`: Required, non-empty string
- `slotId`: Required, non-empty string
- `customerName`: Required, minimum 3 characters
- `customerEmail`: Required, valid email format

Returns `201` with the created booking (status `pending`) on success.

**Error response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "path": ["customerName"],
      "message": "Customer name must be at least 3 characters"
    }
  ]
}
```

### `PUT /api/bookings/:id`

Request body:

```json
{
  "status": "confirmed"
}
```

`status` must be one of `pending`, `confirmed`, or `cancelled`.

## Project Structure

```
src/
├── index.ts              # Express app setup and main routes
├── types/
│   └── models.ts         # Domain types (Venue, TimeSlot, Booking, etc.)
├── validation/
│   └── schemas.ts        # Zod validation schemas for API requests
├── services/
│   ├── booking.ts        # Booking business logic
│   ├── venue.ts          # Venue business logic
│   └── availability.ts   # Availability computation logic
├── controllers/
│   ├── booking.ts        # Booking HTTP request handlers
│   ├── venue.ts          # Venue HTTP request handlers
│   └── availability.ts   # Availability HTTP request handlers
├── routes/
│   ├── booking.ts        # Booking route definitions
│   ├── venue.ts          # Venue route definitions
│   ├── availability.ts   # Availability route definitions
│   └── health.ts         # Health check route
└── data/
    └── mockData.ts       # In-memory mock data storage
```

### Architecture

The application follows a **layered architecture** with clear separation of concerns:

- **Routes** — Express route definitions
- **Controllers** — HTTP request/response handling with Zod validation
- **Services** — Pure business logic, independent of HTTP
- **Types** — Centralized domain type definitions
- **Validation** — Zod schemas for request validation
- **Data** — Mock data storage (in-memory)

This structure is production-ready and scales well as the application grows.

## Scripts

| Script          | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Run the server with hot reload via `tsx`     |
| `npm run build` | Type-check and compile TypeScript to `dist/` |
| `npm start`     | Run the compiled server from `dist/index.js` |
| `npm test`      | Not yet implemented                          |
