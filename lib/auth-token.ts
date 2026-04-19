import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'campus_ride_token';
const REFRESH_TOKEN_KEY = 'campus_ride_refresh_token';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export async function saveAuthToken(token: string): Promise<void> {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (isWeb()) {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    if (canUseLocalStorage()) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
}

export async function saveRefreshToken(token: string): Promise<void> {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb()) {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    if (canUseLocalStorage()) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }
}

/** Remove access e refresh (sessão encerrada no cliente). */
export async function clearAuthToken(): Promise<void> {
  if (isWeb()) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    if (canUseLocalStorage()) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}
