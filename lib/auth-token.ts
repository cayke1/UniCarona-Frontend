import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'campus_ride_token';

type SecureStoreLike = {
  setItemAsync?: (key: string, value: string) => Promise<void>;
  getItemAsync?: (key: string) => Promise<string | null>;
  deleteItemAsync?: (key: string) => Promise<void>;
};

const secureStore = SecureStore as SecureStoreLike;

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export async function saveAuthToken(token: string): Promise<void> {
  if (secureStore.setItemAsync) {
    try {
      await secureStore.setItemAsync(TOKEN_KEY, token);
      return;
    } catch {
      // Fallback below (mainly for web/runtime incompatibilities).
    }
  }

  if (canUseLocalStorage()) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (secureStore.getItemAsync) {
    try {
      return await secureStore.getItemAsync(TOKEN_KEY);
    } catch {
      // Fallback below (mainly for web/runtime incompatibilities).
    }
  }

  if (canUseLocalStorage()) {
    return localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

export async function clearAuthToken(): Promise<void> {
  if (secureStore.deleteItemAsync) {
    try {
      await secureStore.deleteItemAsync(TOKEN_KEY);
      return;
    } catch {
      // Fallback below (mainly for web/runtime incompatibilities).
    }
  }

  if (canUseLocalStorage()) {
    localStorage.removeItem(TOKEN_KEY);
  }
}
