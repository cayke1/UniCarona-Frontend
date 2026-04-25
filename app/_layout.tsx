import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { Colors } from '@/constants/theme';
import { UserProvider } from '@/contexts/user-context';
import { getAuthToken } from '@/lib/auth-token';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootStack() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAuthToken();
      if (!cancelled) {
        setIsAuthenticated(!!token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const authRoutes = ['login', 'register', 'forgot-password'];
    const inAuthRoute = authRoutes.includes(pathname);

    if (!isAuthenticated && !inAuthRoute) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, pathname]);

  if (isAuthenticated === null) {
    return null;
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
      <Stack.Screen name="dev/ride-preview" options={{ headerShown: false }} />
      <Stack.Screen name="dev/profile-preview" options={{ headerShown: false }} />
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
