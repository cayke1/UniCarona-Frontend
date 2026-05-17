import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFERRED_METHOD_KEY = 'unicarona_preferred_payment_method';

export type PreferredPaymentMethod = 'pix' | 'card';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function parseMethod(value: string | null): PreferredPaymentMethod | null {
  if (value === 'pix' || value === 'card') return value;
  return null;
}

export async function getPreferredPaymentMethod(): Promise<PreferredPaymentMethod> {
  try {
    if (isWeb()) {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(PREFERRED_METHOD_KEY) : null;
      return parseMethod(stored) ?? 'pix';
    }
    const stored = await SecureStore.getItemAsync(PREFERRED_METHOD_KEY);
    return parseMethod(stored) ?? 'pix';
  } catch {
    if (canUseLocalStorage()) {
      return parseMethod(localStorage.getItem(PREFERRED_METHOD_KEY)) ?? 'pix';
    }
    return 'pix';
  }
}

export async function setPreferredPaymentMethod(method: PreferredPaymentMethod): Promise<void> {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREFERRED_METHOD_KEY, method);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(PREFERRED_METHOD_KEY, method);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.setItem(PREFERRED_METHOD_KEY, method);
    }
  }
}

export function preferredPaymentMethodLabel(method: PreferredPaymentMethod): string {
  return method === 'pix' ? 'PIX instantâneo' : 'Cartão de crédito';
}
