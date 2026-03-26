const trimmed = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

/** URL base do backend, sem barra final. Ex.: http://localhost:3000 */
export const apiBaseUrl = trimmed && trimmed.length > 0 ? trimmed : 'http://localhost:3000';
