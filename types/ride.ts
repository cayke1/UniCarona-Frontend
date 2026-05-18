export type RideStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';

export type MapRide = {
  id: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  availableSeats: number;
  costPerSeat: number;
  distanceKm: number;
  driver: {
    name: string;
    photoUrl: string | null;
  };
};

export type DriverRide = {
  id: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  pendingRequests: Array<{
    id: string;
    requestedSeats: number;
    pickupLocation: string;
    dropoffLocation: string;
    estimatedCost: number;
    createdAt: string;
    passenger: { id: string; name: string };
  }>;
};

export type DriverRideHistory = {
  id: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  totalSeats: number;
  paidPassengers: number;
};

export type MyRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'AWAITING_PAYMENT' | 'PAID' | 'REJECTED' | 'CANCELLED';
  requestedSeats: number;
  estimatedCost: number;
  totalCharged: number;
  createdAt: string;
  ride: {
    id: string;
    status?: string;
    originAddress: string;
    originLat?: number;
    originLng?: number;
    destinationAddress: string;
    destinationLat?: number;
    destinationLng?: number;
    departureTime: string;
    driver: { name: string; id?: string; photoUrl?: string | null };
  };
};

export type RideDetail = {
  id: string;
  departureTime: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  totalSeats: number;
  availableSeats: number;
  costPerKm: number;
  distanceKm: number;
  estimatedTotalCost: number;
  costPerSeat: number;
  status: string;
  driver: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
};

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type PassengerRequest = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  course?: string;
  pricePerSeat: number;
  requestedSeats: number;
  verified: boolean;
  /** pending → motorista aceitou → awaiting_payment → paid (PAGA) */
  status: 'pending' | 'awaiting_payment' | 'paid' | 'accepted' | 'rejected' | 'cancelled';
};

export type Ride = {
  id: string;
  driver: {
    id: string;
    name: string;
    rating?: number;
    vehicle?: string;
  };
  origin: string;
  destination: string;
  originCoordinate?: RoutePoint;
  destinationCoordinate?: RoutePoint;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: RideStatus;
  acceptingRequests?: boolean;
  passengerRequests?: PassengerRequest[];
};
