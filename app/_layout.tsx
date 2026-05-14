import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { UserProvider, useUser } from '@/contexts/user-context';
import { getAuthToken } from '@/lib/auth-token';
import { useColorScheme } from '@/hooks/use-color-scheme';

function authLeafFromPath(pathname: string): string {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function RootStack() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, error, initialHydrationDone } = useUser();
  const [tokenPresent, setTokenPresent] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getAuthToken();
      if (!cancelled) {
        setTokenPresent(!!token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, user, error]);

  const leaf = authLeafFromPath(pathname);
  const inAuthRoute = ['login', 'register', 'forgot-password'].includes(leaf);

  useEffect(() => {
    if (!initialHydrationDone || tokenPresent === null) return;

    if (!tokenPresent && !inAuthRoute) {
      router.replace('/login');
    } else if (tokenPresent && inAuthRoute && user) {
      router.replace('/(tabs)');
    }
  }, [initialHydrationDone, tokenPresent, inAuthRoute, user, pathname, router]);

  if (!initialHydrationDone || tokenPresent === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.background,
        }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="become-driver"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="publish-ride" options={{ headerShown: false }} />
      <Stack.Screen name="ride/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationTheme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: Colors.dark.background,
            card: Colors.dark.surface,
            text: Colors.dark.text,
            border: Colors.dark.border,
            primary: Colors.dark.tint,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: Colors.light.background,
            card: Colors.light.surface,
            text: Colors.light.text,
            border: Colors.light.border,
            primary: Colors.light.tint,
          },
        };

  return (
    <ThemeProvider value={navigationTheme}>
      <UserProvider>
        <RootStack />
        <Toast />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </UserProvider>
    </ThemeProvider>
  );
}
