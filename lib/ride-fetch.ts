import { ApiError, ridesApi } from '@/lib/api';
import { normalizeRideListPayload, type NormalizedRide } from '@/lib/user-types';

const ACTIVE_HINTS = ['OPEN', 'ACTIVE', 'SCHEDULED', 'AGENDADA', 'PENDENTE', 'CONFIRMADA'];

function isActiveStatus(status: string): boolean {
  const u = status.toUpperCase();
  return ACTIVE_HINTS.some((h) => u.includes(h));
}

export async function fetchDriverRidesActive(): Promise<NormalizedRide[]> {
  let payload: unknown;
  try {
    payload = await ridesApi.listMyDriverRides();
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
      payload = await ridesApi.listMyRidesViaUser();
    } else {
      throw e;
    }
  }
  const all = normalizeRideListPayload(payload as Record<string, unknown>);
  const active = all.filter((r) => isActiveStatus(r.status));
  return active.length > 0 ? active : all;
}
