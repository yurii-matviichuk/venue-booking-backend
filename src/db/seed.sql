-- Sample data for local development only. Do not run this in production.
-- Run after schema.sql: psql -d venue_booking -f src/db/seed.sql
-- Slot dates are written for 2026-10-20 as day 0 and shifted at the bottom of this file, so they are always upcoming.

-- image_file is only the file name: the frontend serves it from its public/images/venues/ folder
INSERT INTO venues (id, name, location, city, timezone, category, description, image_file) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Bowling Alley Downtown', 'Downtown', 'New York', 'America/New_York', 'Bowling', 'Classic lanes, shoe rental and a snack bar. Great for groups and birthdays.', 'bowling-alley.jpg'),
  ('10000000-0000-4000-8000-000000000002', 'Darts Lounge', 'Midtown', 'Chicago', 'America/Chicago', 'Darts', 'Relaxed lounge with electronic and steel-tip boards and a full bar.', 'darts-lounge.jpg'),
  ('10000000-0000-4000-8000-000000000003', 'Escape Room Vault', 'Downtown', 'New York', 'America/New_York', 'Escape Room', 'Crack the code of a bank heist before the clock runs out.', 'escape-room.jpg'),
  ('10000000-0000-4000-8000-000000000004', 'Laser Tag Arena', 'Eastside', 'Chicago', 'America/Chicago', 'Laser Tag', 'Two-level arena with fog, neon and team matches.', 'laser-tag.jpg'),
  ('10000000-0000-4000-8000-000000000005', 'Retro Arcade Hall', 'Uptown', 'Denver', 'America/Denver', 'Arcade', 'Over 80 vintage cabinets and pinball machines, all on free play.', 'retro-arcade.jpg'),
  ('10000000-0000-4000-8000-000000000006', 'VR Zone', 'Tech District', 'Los Angeles', 'America/Los_Angeles', 'Virtual Reality', 'Step into immersive VR games, solo or with friends.', 'vr-zone.jpg'),
  ('10000000-0000-4000-8000-000000000007', 'Racing Simulator Lounge', 'Airport Road', 'Chicago', 'America/Chicago', 'Racing', 'Full-motion race simulators with real pedals and wheels.', 'racing-simulator.jpg'),
  ('10000000-0000-4000-8000-000000000008', 'Mini Golf Park', 'Riverside', 'New York', 'America/New_York', 'Mini Golf', 'Eighteen themed holes by the river, fun for the whole family.', 'mini-golf.jpg'),
  ('10000000-0000-4000-8000-000000000009', 'Go-Kart Speedway', 'Industrial Park', 'Phoenix', 'America/Phoenix', 'Go-Karts', 'Fast electric karts on a timed outdoor track.', 'go-karts.jpg'),
  ('10000000-0000-4000-8000-000000000010', 'Trampoline Jump Park', 'Suburbs', 'Chicago', 'America/Chicago', 'Trampoline Park', 'Wall-to-wall trampolines, foam pits and dodgeball courts.', 'trampoline-park.jpg'),
  ('10000000-0000-4000-8000-000000000011', 'Bouldering Climbing Gym', 'Old Town', 'Denver', 'America/Denver', 'Climbing', 'Routes for every level with coaching for beginners.', 'bouldering-gym.jpg'),
  ('10000000-0000-4000-8000-000000000012', 'Billiards Pool Hall', 'Westside', 'New York', 'America/New_York', 'Billiards', 'Twelve pool tables in a laid-back hall with a bar.', 'billiards.jpg'),
  ('10000000-0000-4000-8000-000000000013', 'Stage Nine Karaoke Bar', 'Nightlife District', 'Los Angeles', 'America/Los_Angeles', 'Karaoke', 'Private rooms and a main stage with 50,000 songs.', 'karaoke.jpg'),
  ('10000000-0000-4000-8000-000000000014', 'Board Game Café', 'Campus', 'Chicago', 'America/Chicago', 'Board Games', 'Hundreds of board games, plus coffee, snacks and friendly staff to teach them.', 'board-games.jpg'),
  ('10000000-0000-4000-8000-000000000015', 'Riverside Cinema', 'Riverside', 'New York', 'America/New_York', 'Cinema', 'Independent films and new releases in a restored single-screen theater.', 'cinema.jpg'),
  ('10000000-0000-4000-8000-000000000016', 'Live Music House', 'Arts District', 'Chicago', 'America/Chicago', 'Live Music', 'Local and touring bands on a stage with a great sound system.', 'live-music.jpg'),
  ('10000000-0000-4000-8000-000000000017', 'Laugh Track Comedy Club', 'Midtown', 'New York', 'America/New_York', 'Comedy', 'Stand-up nights with headliners and open-mic newcomers.', 'comedy-club.jpg'),
  ('10000000-0000-4000-8000-000000000018', 'Grand Playhouse', 'Theater Row', 'New York', 'America/New_York', 'Theater', 'A historic theater staging plays and musicals all season.', 'theater.jpg'),
  ('10000000-0000-4000-8000-000000000019', 'Axe Lodge', 'Brewery Quarter', 'Denver', 'America/Denver', 'Axe Throwing', 'Throwing lanes with a coach on hand, next to a craft brewery.', 'axe-throwing.jpg'),
  ('10000000-0000-4000-8000-000000000020', 'Airsoft Field Outpost', 'Forest Edge', 'Phoenix', 'America/Phoenix', 'Airsoft', 'Outdoor battlefield with bunkers, gear rental and game masters.', 'airsoft.jpg'),
  ('10000000-0000-4000-8000-000000000021', 'Cooking Studio Kitchen', 'Market Square', 'Los Angeles', 'America/Los_Angeles', 'Cooking Class', 'Hands-on classes where you cook a full meal and then eat it.', 'cooking-studio.jpg'),
  ('10000000-0000-4000-8000-000000000022', 'Clay and Wheel Pottery Studio', 'Arts District', 'Chicago', 'America/Chicago', 'Pottery', 'Learn to throw a pot on the wheel and take your piece home.', 'pottery-studio.jpg'),
  ('10000000-0000-4000-8000-000000000023', 'Paint and Sip Studio', 'Downtown', 'Los Angeles', 'America/Los_Angeles', 'Painting', 'Follow a guided painting lesson with a drink in hand.', 'paint-and-sip.jpg');

INSERT INTO time_slots (id, venue_id, start_time, end_time, price, capacity, booked) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-10-20T10:00:00Z', '2026-10-20T11:00:00Z', 25.00, 4, 2),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '2026-10-20T14:00:00Z', '2026-10-20T15:00:00Z', 25.00, 4, 0),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '2026-10-20T18:00:00Z', '2026-10-20T19:00:00Z', 30.00, 6, 3);

-- New venues get different slot counts, days, local hours, durations and weekend prices. Nothing is booked yet.
INSERT INTO time_slots (venue_id, start_time, end_time, price, capacity, booked) VALUES
  ('10000000-0000-4000-8000-000000000003', '2026-10-22T18:00:00-04:00', '2026-10-22T19:00:00-04:00', 35.00, 6, 0),
  ('10000000-0000-4000-8000-000000000003', '2026-10-22T20:30:00-04:00', '2026-10-22T21:30:00-04:00', 35.00, 6, 0),
  ('10000000-0000-4000-8000-000000000003', '2026-10-24T13:00:00-04:00', '2026-10-24T14:00:00-04:00', 40.00, 6, 0),
  ('10000000-0000-4000-8000-000000000003', '2026-10-24T15:30:00-04:00', '2026-10-24T16:30:00-04:00', 40.00, 6, 0),
  ('10000000-0000-4000-8000-000000000003', '2026-10-25T11:00:00-04:00', '2026-10-25T12:00:00-04:00', 40.00, 6, 0),
  ('10000000-0000-4000-8000-000000000004', '2026-10-23T17:00:00-05:00', '2026-10-23T18:00:00-05:00', 20.00, 10, 0),
  ('10000000-0000-4000-8000-000000000004', '2026-10-23T19:00:00-05:00', '2026-10-23T20:00:00-05:00', 20.00, 10, 0),
  ('10000000-0000-4000-8000-000000000004', '2026-10-24T12:00:00-05:00', '2026-10-24T13:00:00-05:00', 24.00, 10, 0),
  ('10000000-0000-4000-8000-000000000004', '2026-10-24T14:00:00-05:00', '2026-10-24T15:00:00-05:00', 24.00, 10, 0),
  ('10000000-0000-4000-8000-000000000005', '2026-10-22T16:00:00-06:00', '2026-10-22T17:30:00-06:00', 10.00, 20, 0),
  ('10000000-0000-4000-8000-000000000005', '2026-10-25T10:00:00-06:00', '2026-10-25T12:00:00-06:00', 15.00, 20, 0),
  ('10000000-0000-4000-8000-000000000006', '2026-10-22T19:00:00-07:00', '2026-10-22T20:00:00-07:00', 30.00, 4, 0),
  ('10000000-0000-4000-8000-000000000006', '2026-10-22T20:30:00-07:00', '2026-10-22T21:30:00-07:00', 30.00, 4, 0),
  ('10000000-0000-4000-8000-000000000006', '2026-10-23T19:00:00-07:00', '2026-10-23T20:00:00-07:00', 30.00, 4, 0),
  ('10000000-0000-4000-8000-000000000006', '2026-10-27T12:00:00-07:00', '2026-10-27T13:00:00-07:00', 30.00, 4, 0),
  ('10000000-0000-4000-8000-000000000007', '2026-10-24T18:00:00-05:00', '2026-10-24T19:30:00-05:00', 45.00, 4, 0),
  ('10000000-0000-4000-8000-000000000007', '2026-10-24T20:00:00-05:00', '2026-10-24T21:30:00-05:00', 45.00, 4, 0),
  ('10000000-0000-4000-8000-000000000007', '2026-10-25T14:00:00-05:00', '2026-10-25T15:30:00-05:00', 50.00, 4, 0),
  ('10000000-0000-4000-8000-000000000008', '2026-10-22T10:00:00-04:00', '2026-10-22T11:00:00-04:00', 15.00, 12, 0),
  ('10000000-0000-4000-8000-000000000008', '2026-10-24T10:00:00-04:00', '2026-10-24T11:00:00-04:00', 18.00, 12, 0),
  ('10000000-0000-4000-8000-000000000008', '2026-10-24T11:30:00-04:00', '2026-10-24T12:30:00-04:00', 18.00, 12, 0),
  ('10000000-0000-4000-8000-000000000008', '2026-10-25T15:00:00-04:00', '2026-10-25T16:00:00-04:00', 18.00, 12, 0),
  ('10000000-0000-4000-8000-000000000009', '2026-10-23T18:00:00-07:00', '2026-10-23T19:00:00-07:00', 25.00, 8, 0),
  ('10000000-0000-4000-8000-000000000009', '2026-10-24T16:00:00-07:00', '2026-10-24T17:00:00-07:00', 30.00, 8, 0),
  ('10000000-0000-4000-8000-000000000009', '2026-10-24T18:00:00-07:00', '2026-10-24T19:00:00-07:00', 30.00, 8, 0),
  ('10000000-0000-4000-8000-000000000009', '2026-10-25T12:00:00-07:00', '2026-10-25T13:00:00-07:00', 30.00, 8, 0),
  ('10000000-0000-4000-8000-000000000010', '2026-10-23T16:30:00-05:00', '2026-10-23T17:30:00-05:00', 18.00, 20, 0),
  ('10000000-0000-4000-8000-000000000010', '2026-10-25T09:00:00-05:00', '2026-10-25T10:00:00-05:00', 20.00, 20, 0),
  ('10000000-0000-4000-8000-000000000010', '2026-10-25T10:30:00-05:00', '2026-10-25T11:30:00-05:00', 20.00, 20, 0),
  ('10000000-0000-4000-8000-000000000011', '2026-10-22T18:30:00-06:00', '2026-10-22T19:30:00-06:00', 22.00, 15, 0),
  ('10000000-0000-4000-8000-000000000011', '2026-10-22T20:00:00-06:00', '2026-10-22T21:00:00-06:00', 22.00, 15, 0),
  ('10000000-0000-4000-8000-000000000011', '2026-10-26T17:00:00-06:00', '2026-10-26T18:00:00-06:00', 22.00, 15, 0),
  ('10000000-0000-4000-8000-000000000012', '2026-10-23T19:00:00-04:00', '2026-10-23T20:00:00-04:00', 14.00, 8, 0),
  ('10000000-0000-4000-8000-000000000012', '2026-10-23T20:00:00-04:00', '2026-10-23T21:00:00-04:00', 14.00, 8, 0),
  ('10000000-0000-4000-8000-000000000012', '2026-10-24T21:00:00-04:00', '2026-10-24T22:00:00-04:00', 18.00, 8, 0),
  ('10000000-0000-4000-8000-000000000013', '2026-10-23T21:00:00-07:00', '2026-10-23T23:00:00-07:00', 20.00, 12, 0),
  ('10000000-0000-4000-8000-000000000013', '2026-10-24T21:00:00-07:00', '2026-10-24T23:00:00-07:00', 25.00, 12, 0),
  ('10000000-0000-4000-8000-000000000014', '2026-10-22T12:00:00-05:00', '2026-10-22T14:00:00-05:00', 12.00, 16, 0),
  ('10000000-0000-4000-8000-000000000014', '2026-10-22T14:30:00-05:00', '2026-10-22T16:30:00-05:00', 12.00, 16, 0),
  ('10000000-0000-4000-8000-000000000014', '2026-10-24T12:00:00-05:00', '2026-10-24T14:00:00-05:00', 14.00, 16, 0),
  ('10000000-0000-4000-8000-000000000014', '2026-10-25T12:00:00-05:00', '2026-10-25T14:00:00-05:00', 14.00, 16, 0),
  ('10000000-0000-4000-8000-000000000015', '2026-10-22T19:30:00-04:00', '2026-10-22T21:30:00-04:00', 13.00, 60, 0),
  ('10000000-0000-4000-8000-000000000015', '2026-10-23T19:30:00-04:00', '2026-10-23T21:30:00-04:00', 13.00, 60, 0),
  ('10000000-0000-4000-8000-000000000015', '2026-10-24T14:00:00-04:00', '2026-10-24T16:00:00-04:00', 15.00, 60, 0),
  ('10000000-0000-4000-8000-000000000015', '2026-10-24T19:30:00-04:00', '2026-10-24T21:30:00-04:00', 15.00, 60, 0),
  ('10000000-0000-4000-8000-000000000015', '2026-10-25T17:00:00-04:00', '2026-10-25T19:00:00-04:00', 15.00, 60, 0),
  ('10000000-0000-4000-8000-000000000016', '2026-10-23T20:00:00-05:00', '2026-10-23T23:00:00-05:00', 35.00, 150, 0),
  ('10000000-0000-4000-8000-000000000016', '2026-10-24T20:00:00-05:00', '2026-10-24T23:30:00-05:00', 45.00, 150, 0),
  ('10000000-0000-4000-8000-000000000017', '2026-10-23T20:00:00-04:00', '2026-10-23T21:30:00-04:00', 25.00, 80, 0),
  ('10000000-0000-4000-8000-000000000017', '2026-10-24T20:00:00-04:00', '2026-10-24T21:30:00-04:00', 30.00, 80, 0),
  ('10000000-0000-4000-8000-000000000017', '2026-10-24T22:00:00-04:00', '2026-10-24T23:30:00-04:00', 30.00, 80, 0),
  ('10000000-0000-4000-8000-000000000018', '2026-10-24T19:30:00-04:00', '2026-10-24T22:00:00-04:00', 45.00, 300, 0),
  ('10000000-0000-4000-8000-000000000018', '2026-10-25T14:00:00-04:00', '2026-10-25T16:30:00-04:00', 40.00, 300, 0),
  ('10000000-0000-4000-8000-000000000019', '2026-10-23T18:00:00-06:00', '2026-10-23T19:00:00-06:00', 28.00, 10, 0),
  ('10000000-0000-4000-8000-000000000019', '2026-10-24T17:00:00-06:00', '2026-10-24T18:00:00-06:00', 32.00, 10, 0),
  ('10000000-0000-4000-8000-000000000019', '2026-10-24T19:00:00-06:00', '2026-10-24T20:00:00-06:00', 32.00, 10, 0),
  ('10000000-0000-4000-8000-000000000019', '2026-10-25T13:00:00-06:00', '2026-10-25T14:00:00-06:00', 32.00, 10, 0),
  ('10000000-0000-4000-8000-000000000020', '2026-10-24T09:00:00-07:00', '2026-10-24T11:00:00-07:00', 35.00, 20, 0),
  ('10000000-0000-4000-8000-000000000020', '2026-10-25T09:00:00-07:00', '2026-10-25T11:00:00-07:00', 35.00, 20, 0),
  ('10000000-0000-4000-8000-000000000020', '2026-10-25T13:00:00-07:00', '2026-10-25T15:00:00-07:00', 40.00, 20, 0),
  ('10000000-0000-4000-8000-000000000021', '2026-10-24T18:00:00-07:00', '2026-10-24T20:30:00-07:00', 65.00, 12, 0),
  ('10000000-0000-4000-8000-000000000021', '2026-10-26T18:00:00-07:00', '2026-10-26T20:30:00-07:00', 65.00, 12, 0),
  ('10000000-0000-4000-8000-000000000022', '2026-10-22T18:30:00-05:00', '2026-10-22T20:30:00-05:00', 48.00, 10, 0),
  ('10000000-0000-4000-8000-000000000022', '2026-10-25T11:00:00-05:00', '2026-10-25T13:00:00-05:00', 52.00, 10, 0),
  ('10000000-0000-4000-8000-000000000022', '2026-10-25T14:00:00-05:00', '2026-10-25T16:00:00-05:00', 52.00, 10, 0),
  ('10000000-0000-4000-8000-000000000023', '2026-10-23T19:00:00-07:00', '2026-10-23T21:00:00-07:00', 32.00, 20, 0),
  ('10000000-0000-4000-8000-000000000023', '2026-10-24T19:00:00-07:00', '2026-10-24T21:00:00-07:00', 36.00, 20, 0),
  ('10000000-0000-4000-8000-000000000023', '2026-10-24T21:30:00-07:00', '2026-10-24T23:30:00-07:00', 36.00, 20, 0),
  ('10000000-0000-4000-8000-000000000023', '2026-10-26T19:00:00-07:00', '2026-10-26T21:00:00-07:00', 32.00, 20, 0);

-- Move every slot so the earliest day (2026-10-20) becomes tomorrow, whenever the seed is run.
-- Days are added in each venue's own timezone, so a 7 PM slot stays at 7 PM local time across daylight saving changes.
UPDATE time_slots AS s
SET start_time = ((s.start_time AT TIME ZONE v.timezone) + shift.days * INTERVAL '1 day') AT TIME ZONE v.timezone,
    end_time = ((s.end_time AT TIME ZONE v.timezone) + shift.days * INTERVAL '1 day') AT TIME ZONE v.timezone
FROM venues AS v, (SELECT CURRENT_DATE + 1 - DATE '2026-10-20' AS days) AS shift
WHERE v.id = s.venue_id;

-- Fill the next 28 days with more slots for every venue so the availability calendar has dates to browse.
-- Each venue keeps the duration, price and capacity of its slots above (most common duration if they differ), with a 20% weekend uplift.
-- Slots start at 10:00 local time and are spaced a duration plus 2 hours apart, ending by 21:00 so they never overlap each other or the slots above.
-- Roughly a quarter of days get no slots and a third of slots are dropped, so the calendar has disabled days.
INSERT INTO time_slots (venue_id, start_time, end_time, price, capacity, booked)
SELECT v.id,
       (day.d + slot.start_offset) AT TIME ZONE v.timezone,
       (day.d + slot.start_offset + s.duration) AT TIME ZONE v.timezone,
       CASE WHEN EXTRACT(DOW FROM day.d) IN (0, 6) THEN ROUND(s.base_price * 1.2) ELSE s.base_price END,
       s.capacity,
       0
FROM venues AS v
CROSS JOIN generate_series(1, 28) AS g(n)
CROSS JOIN LATERAL (SELECT CURRENT_DATE + g.n AS d) AS day
JOIN LATERAL (
  SELECT COALESCE(MIN(price), 25) AS base_price,
         COALESCE(MAX(capacity), 6) AS capacity,
         COALESCE(MODE() WITHIN GROUP (ORDER BY end_time - start_time), INTERVAL '1 hour') AS duration
  FROM time_slots
  WHERE venue_id = v.id
) AS s ON TRUE
CROSS JOIN generate_series(0, 10) AS k(i)
CROSS JOIN LATERAL (SELECT INTERVAL '10 hours' + k.i * (s.duration + INTERVAL '2 hours') AS start_offset) AS slot
WHERE slot.start_offset + s.duration <= INTERVAL '21 hours'
  AND abs(hashtext(v.id::text || day.d::text)) % 4 <> 0
  AND abs(hashtext(v.id::text || day.d::text || k.i::text)) % 3 <> 0
  AND NOT EXISTS (
    SELECT 1 FROM time_slots AS t
    WHERE t.venue_id = v.id
      AND t.start_time < (day.d + slot.start_offset + s.duration) AT TIME ZONE v.timezone
      AND t.end_time > (day.d + slot.start_offset) AT TIME ZONE v.timezone
  );

-- Seed customers can't log in: '!' is not a valid bcrypt hash, so no password matches it
INSERT INTO users (id, email, name, password_hash) VALUES
  ('40000000-0000-4000-8000-000000000001', 'john@example.com', 'John Doe', '!'),
  ('40000000-0000-4000-8000-000000000002', 'jane@example.com', 'Jane Smith', '!'),
  ('40000000-0000-4000-8000-000000000003', 'bob@example.com', 'Bob Johnson', '!');

INSERT INTO bookings (id, time_slot_id, venue_id, user_id, customer_name, customer_email, status) VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'John Doe', 'john@example.com', 'confirmed'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'Jane Smith', 'jane@example.com', 'confirmed'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', 'Bob Johnson', 'bob@example.com', 'pending');
