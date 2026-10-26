// Every error the API can return is defined here: a stable code, an HTTP status, and a message.
// Services and controllers throw AppError with one of these codes; the error handler in
// src/app.ts turns it into the JSON response. To add an error, add an entry to errorDefinitions.
const errorDefinitions = {
  INVALID_JSON: { status: 400, message: 'Request body must be valid JSON' },
  VALIDATION_FAILED: { status: 400, message: 'Validation failed' },
  EMAIL_TAKEN: { status: 409, message: 'Email is already registered' },
  SLOT_FULLY_BOOKED: { status: 409, message: 'Slot is fully booked' },
  INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
  UNAUTHORIZED: { status: 401, message: 'Authentication required' },
  FORBIDDEN: { status: 403, message: 'You do not have permission to do this' },
  INVALID_STATUS_CHANGE: { status: 400, message: 'This booking status change is not allowed' },
  SLOT_ALREADY_STARTED: { status: 400, message: 'Slot has already started' },
  ROUTE_NOT_FOUND: { status: 404, message: 'Route not found' },
  VENUE_NOT_FOUND: { status: 404, message: 'Venue not found' },
  SLOT_NOT_FOUND: { status: 404, message: 'Slot not found' },
  BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
} as const;

export type ErrorCode = keyof typeof errorDefinitions;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, details?: unknown) {
    super(errorDefinitions[code].message);
    this.name = 'AppError';
    this.code = code;
    this.status = errorDefinitions[code].status;
    this.details = details;
  }
}
