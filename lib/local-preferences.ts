import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export async function getJsonPreference<T>(key: string, fallback: T): Promise<T> {
  try {
    let raw: string | null = null;
    if (isWeb()) {
      raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } else {
      raw = await SecureStore.getItemAsync(key);
    }
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    if (canUseLocalStorage()) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        /* ignore */
      }
    }
    return fallback;
  }
}

export async function setJsonPreference<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, serialized);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, serialized);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.setItem(key, serialized);
    }
  }
}
