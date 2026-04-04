/** URLs dos termos (substitua no .env ou aqui). */
export const LEGAL_URLS = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://example.com/termos',
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://example.com/privacidade',
} as const;
