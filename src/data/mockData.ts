import type { Venue, TimeSlot } from '../types/models';

export const venues: Venue[] = [
  {
    id: '1',
    name: 'Downtown Bowling',
    location: 'New York',
    timezone: 'America/New_York',
  },
  {
    id: '2',
    name: 'Darts Lounge',
    location: 'Brooklyn',
    timezone: 'America/New_York',
  },
];

export const timeSlots: TimeSlot[] = [
  {
    id: 'slot-1',
    venueId: '1',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T11:00:00Z',
    price: 30,
    capacity: 4,
    booked: 0,
  },
  {
    id: 'slot-2',
    venueId: '1',
    startTime: '2024-01-15T11:00:00Z',
    endTime: '2024-01-15T12:00:00Z',
    price: 30,
    capacity: 4,
    booked: 1,
  },
  {
    id: 'slot-3',
    venueId: '1',
    startTime: '2024-01-15T19:00:00Z',
    endTime: '2024-01-15T20:00:00Z',
    price: 50,
    capacity: 4,
    booked: 2,
  },
  {
    id: 'slot-4',
    venueId: '2',
    startTime: '2024-01-15T14:00:00Z',
    endTime: '2024-01-15T15:00:00Z',
    price: 25,
    capacity: 6,
    booked: 0,
  },
];
