export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  timezone: string;
  category: string;
  description: string;
  imageFile: string | null;
};

// A venue in the list: also the lowest price per spot among its upcoming slots (null if it has none)
export type VenueListItem = Venue & { minPricePerSpot: number | null };

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
  spots: number;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
  createdAt: string;
  updatedAt?: string;
};

// A booking with the venue and slot details a customer needs to recognise it
export type BookingDetails = Booking & {
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueTimezone: string;
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

export type AvailabilitySlot = {
  id: string;
  time: string;
  endTime: string;
  price: number;
  available: boolean;
  spotsRemaining: number;
};
