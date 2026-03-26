import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@unicarona/access_token';
const REFRESH_TOKEN_KEY = '@unicarona/refresh_token';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
    const writes: Promise<void>[] = [AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)];
    if (refreshToken != null && refreshToken !== '') {
      writes.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));
    }
    await Promise.all(writes);
  },

  async clear(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
