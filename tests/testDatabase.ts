// The tests run against their own database, never the development one.
// Override with TEST_DATABASE_URL; the database name must end in "_test" (checked in globalSetup).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://venue_user:venue_password@localhost:5432/venue_booking_test';
