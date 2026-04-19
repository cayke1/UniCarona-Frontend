export type RideStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';

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
  price: number;
  verified: boolean;
  status: 'pending' | 'accepted' | 'rejected';
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
  passengerRequests?: PassengerRequest[];
};
