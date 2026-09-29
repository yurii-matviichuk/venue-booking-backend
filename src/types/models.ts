export type Venue = {
  id: string;
  name: string;
  location: string;
  timezone: string;
};

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
  id: string;
  time: string;
  price: number;
  available: boolean;
  spotsRemaining: number;
};

export type UpdateBookingBody = {
  status: Booking['status'];
};
