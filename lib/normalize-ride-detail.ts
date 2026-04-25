import type { PassengerRequest, Ride, RideStatus } from '@/types/ride';
import { parseDecimal } from '@/lib/parse-decimal';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}

export function normalizeRideDetailPayload(payload: Record<string, unknown>): Ride | null {
  const root = asRecord(payload.data) ?? asRecord(payload.ride) ?? payload;

  const rawId = root.id ?? root._id;
  const id = typeof rawId === 'string' ? rawId : String(rawId ?? '');
  if (!id) return null;

  const driverRaw = asRecord(root.driver) ?? {};
  const driver = {
    id: String(driverRaw.id ?? driverRaw._id ?? ''),
    name: typeof driverRaw.name === 'string' ? driverRaw.name : '',
    rating: typeof driverRaw.rating === 'number' ? driverRaw.rating : undefined,
    vehicle: typeof driverRaw.vehicle === 'string' ? driverRaw.vehicle : undefined,
  };

  const rawStatus = typeof root.status === 'string' ? root.status.toUpperCase() : '';
  const availableSeats = typeof root.availableSeats === 'number' ? root.availableSeats : 0;
  let status: RideStatus;
  if (rawStatus === 'CANCELLED') status = 'cancelled';
  else if (rawStatus === 'COMPLETED') status = 'completed';
  else status = availableSeats === 0 ? 'full' : 'open';

  const originCoordinate =
    typeof root.originLat === 'number' && typeof root.originLng === 'number'
      ? { latitude: root.originLat, longitude: root.originLng }
      : undefined;
  const destinationCoordinate =
    typeof root.destinationLat === 'number' && typeof root.destinationLng === 'number'
      ? { latitude: root.destinationLat, longitude: root.destinationLng }
      : undefined;

  const costPerSeat = parseDecimal(root.costPerSeat ?? root.price);

  const rawRequests = Array.isArray(root.requests)
    ? root.requests
    : Array.isArray(root.passengerRequests)
      ? root.passengerRequests
      : [];

  const passengerRequests: PassengerRequest[] = rawRequests
    .map((r: unknown): PassengerRequest | null => {
      const req = asRecord(r);
      if (!req) return null;
      const passengerObj = asRecord(req.passenger) ?? asRecord(req.user);
      const name =
        typeof passengerObj?.name === 'string'
          ? passengerObj.name
          : typeof req.name === 'string'
            ? req.name
            : '';
      const initials =
        name
          .split(' ')
          .slice(0, 2)
          .map((w: string) => w[0] ?? '')
          .join('')
          .toUpperCase() || '??';

      const rawReqStatus = typeof req.status === 'string' ? req.status.toUpperCase() : '';
      let reqStatus: PassengerRequest['status'];
      if (rawReqStatus === 'AWAITING_PAYMENT') {
        reqStatus = 'awaiting_payment';
      } else if (rawReqStatus === 'PAID') {
        reqStatus = 'paid';
      } else if (rawReqStatus === 'ACCEPTED') {
        reqStatus = 'accepted';
      } else if (rawReqStatus === 'REJECTED' || rawReqStatus === 'CANCELLED') {
        reqStatus = 'rejected';
      } else {
        reqStatus = 'pending';
      }

      return {
        id: String(req.id ?? req._id ?? ''),
        userId: String(passengerObj?.id ?? passengerObj?._id ?? req.passengerId ?? req.userId ?? ''),
        name,
        initials,
        course: typeof req.course === 'string' ? req.course : undefined,
        pricePerSeat: costPerSeat,
        requestedSeats: typeof req.requestedSeats === 'number' ? req.requestedSeats : 1,
        verified: Boolean(req.verified),
        status: reqStatus,
      };
    })
    .filter((r): r is PassengerRequest => r !== null);

  return {
    id,
    driver,
    origin:
      typeof root.originAddress === 'string'
        ? root.originAddress
        : typeof root.origin === 'string'
          ? root.origin
          : '',
    destination:
      typeof root.destinationAddress === 'string'
        ? root.destinationAddress
        : typeof root.destination === 'string'
          ? root.destination
          : '',
    originCoordinate,
    destinationCoordinate,
    departureTime:
      typeof root.departureAt === 'string'
        ? root.departureAt
        : typeof root.departureTime === 'string'
          ? root.departureTime
          : typeof root.departure_time === 'string'
            ? root.departure_time
            : '',
    availableSeats,
    totalSeats:
      typeof root.totalSeats === 'number'
        ? root.totalSeats
        : typeof root.total_seats === 'number'
          ? root.total_seats
          : 4,
    price: costPerSeat,
    status,
    passengerRequests,
  };
}
