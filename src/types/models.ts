export type Venue = {
  id: string;
  name: string;
  location: string;
  timezone: string;
};
  category: string;
  description: string;
  imageFile: string | null;

export type TimeSlot = {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  booked: number;
};

export type Booking = {
  id: string;
  venueId: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
  createdAt: string;
  updatedAt?: string;
};

export type AvailabilitySlot = {
// A booking with the venue and slot details a customer needs to recognise it
export type BookingDetails = Booking & {
  venueName: string;
  venueLocation: string;
  startTime: string;
  endTime: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: string;
};

  id: string;
  time: string;
  price: number;
  available: boolean;
  spotsRemaining: number;
};
