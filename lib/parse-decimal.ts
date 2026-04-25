/** Converte valores numéricos da API (incl. Decimal do Prisma em string). */
export function parseDecimal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
