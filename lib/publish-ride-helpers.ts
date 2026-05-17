import { haversineKm } from '@/lib/geo-distance';

export const MIN_DEPARTURE_LEAD_MS = 15 * 60 * 1000;
export const DEPARTURE_SLOT_MINUTES = 15;

const DEFAULT_COST_PER_KM = 1.5;
const SLOT_MS = DEPARTURE_SLOT_MINUTES * 60 * 1000;

/** Alinhar ao default do backend (`COST_PER_KM`). */
export function defaultCostPerKm(): number {
  const n = Number(process.env.EXPO_PUBLIC_COST_PER_KM);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COST_PER_KM;
}

export function estimateCostsFromDistanceKm(distanceKm: number, totalSeats: number) {
  const costPerKm = defaultCostPerKm();
  const estimatedTotalCost = distanceKm * costPerKm;
  const costPerSeat = totalSeats > 0 ? estimatedTotalCost / totalSeats : estimatedTotalCost;
  return {
    costPerKm,
    estimatedTotalCost: Math.round(estimatedTotalCost * 100) / 100,
    costPerSeat: Math.round(costPerSeat * 100) / 100,
  };
}

/** Converte entrada do usuário em ISO 8601 aceito pelo backend. */
export function toDepartureIso(input: string): string | null {
  const t = input.trim().replace(' ', 'T');
  if (!t) return null;
  let s = t;
  const hasZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
  if (!hasZone) {
    if (s.includes('T')) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = `${s}:00`;
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(s)) s = `${s}:00:00`;
      s = `${s}-03:00`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      s = `${s}T12:00:00-03:00`;
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function validateDepartureFuture(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Data de partida inválida.';
  if (d.getTime() < Date.now() + MIN_DEPARTURE_LEAD_MS) {
    return 'A partida deve ser pelo menos 15 minutos no futuro.';
  }
  return null;
}

/** Arredonda para o próximo bloco de 15 minutos (ex.: 14:07 → 14:15). */
export function roundUpToDepartureSlot(d: Date): Date {
  return new Date(Math.ceil(d.getTime() / SLOT_MS) * SLOT_MS);
}

/** Primeiro horário permitido: agora + 15 min, arredondado para cima em slot de 15 min. */
export function getEarliestDeparture(): Date {
  return roundUpToDepartureSlot(new Date(Date.now() + MIN_DEPARTURE_LEAD_MS));
}

export function formatDepartureDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDepartureTimeHm(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function parseDepartureDateYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day, 12, 0, 0, 0);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

export function getDefaultDepartureFields(): { dateYmd: string; timeHm: string } {
  const earliest = getEarliestDeparture();
  return {
    dateYmd: formatDepartureDateYmd(earliest),
    timeHm: formatDepartureTimeHm(earliest),
  };
}

/** Slots de 15 em 15 min para o dia escolhido (a partir do mínimo se for hoje). */
export function listDepartureTimeSlots(dateYmd: string): string[] {
  const day = parseDepartureDateYmd(dateYmd);
  if (!day) return [];

  const earliest = getEarliestDeparture();
  const earliestYmd = formatDepartureDateYmd(earliest);
  if (dateYmd < earliestYmd) return [];

  const y = day.getFullYear();
  const mo = day.getMonth();
  const d = day.getDate();

  let cursor: Date;
  if (dateYmd === earliestYmd) {
    cursor = new Date(earliest);
  } else {
    cursor = new Date(y, mo, d, 0, 0, 0, 0);
  }

  const end = new Date(y, mo, d, 23, 45, 0, 0);
  const slots: string[] = [];

  while (cursor <= end) {
    slots.push(formatDepartureTimeHm(cursor));
    cursor = new Date(cursor.getTime() + SLOT_MS);
  }

  return slots;
}

export function clampDepartureTimeToDate(dateYmd: string, timeHm: string): string {
  const slots = listDepartureTimeSlots(dateYmd);
  if (slots.length === 0) return formatDepartureTimeHm(getEarliestDeparture());
  if (slots.includes(timeHm)) return timeHm;
  return slots[0];
}

/** Monta ISO a partir de data (YYYY-MM-DD) e hora (HH:mm) no fuso local (-03:00). */
export function buildDepartureIsoFromFields(dateYmd: string, timeHm: string): string | null {
  return toDepartureIso(`${dateYmd.trim()}T${timeHm.trim()}`);
}

export function formatDepartureDateLabel(dateYmd: string): string {
  const d = parseDepartureDateYmd(dateYmd);
  if (!d) return dateYmd;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
}

export function dateTimeFromYmdAndHm(dateYmd: string, timeHm: string): Date {
  const day = parseDepartureDateYmd(dateYmd);
  const [h, min] = timeHm.split(':').map(Number);
  if (!day || !Number.isFinite(h) || !Number.isFinite(min)) return new Date();
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min, 0, 0);
}

export function getDepartureTimePickerBounds(dateYmd: string): {
  minimumDate: Date;
  maximumDate: Date;
} {
  const day = parseDepartureDateYmd(dateYmd);
  if (!day) {
    const n = new Date();
    return { minimumDate: n, maximumDate: n };
  }
  const y = day.getFullYear();
  const mo = day.getMonth();
  const d = day.getDate();
  const earliest = getEarliestDeparture();
  const earliestYmd = formatDepartureDateYmd(earliest);
  const minimumDate =
    dateYmd === earliestYmd ? new Date(earliest) : new Date(y, mo, d, 0, 0, 0, 0);
  const maximumDate = new Date(y, mo, d, 23, 45, 0, 0);
  return { minimumDate, maximumDate };
}

export function distanceKmForPreview(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number,
  routeGeometryKm: number | null
): { distanceKm: number; mode: 'route_api' | 'haversine' } {
  if (routeGeometryKm != null && Number.isFinite(routeGeometryKm) && routeGeometryKm > 0) {
    return { distanceKm: Math.round(routeGeometryKm * 100) / 100, mode: 'route_api' };
  }
  return {
    distanceKm: haversineKm(oLat, oLng, dLat, dLng),
    mode: 'haversine',
  };
}
