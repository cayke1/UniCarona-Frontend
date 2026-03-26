import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiBaseUrl } from '@/lib/env';
import { fetchHealth } from '@/services/api/health';
import { tokenStorage } from '@/services/auth/token-storage';

export default function TabTwoScreen() {
  const tint = useThemeColor({}, 'tint');
  const chipBg = useThemeColor({ light: '#E8E8E8', dark: '#2C2C2C' }, 'background');

  const [healthText, setHealthText] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState<string>('');

  const syncTokenLabel = useCallback(async () => {
    const t = await tokenStorage.getAccessToken();
    setTokenLabel(t ? `Access token salvo (${t.length} caracteres)` : 'Sem access token');
  }, []);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await fetchHealth();
      setHealthText(JSON.stringify(data, null, 2));
    } catch (e) {
      const msg = isAxiosError(e)
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Falha ao chamar a API';
      setHealthError(msg);
      setHealthText(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void runHealthCheck();
    void syncTokenLabel();
  }, [runHealthCheck, syncTokenLabel]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explore
        </ThemedText>
      </ThemedView>
      <Collapsible title="API, Axios e token (AsyncStorage)">
        <ThemedText>
          Base URL: <ThemedText type="defaultSemiBold">{apiBaseUrl}</ThemedText> (defina{' '}
          <ThemedText type="defaultSemiBold">EXPO_PUBLIC_API_URL</ThemedText> no{' '}
          <ThemedText type="defaultSemiBold">.env</ThemedText> se necessário)
        </ThemedText>
        <ThemedText style={styles.apiTokenLine}>{tokenLabel}</ThemedText>
        {healthLoading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : healthError ? (
          <ThemedText style={styles.apiError}>{healthError}</ThemedText>
        ) : healthText ? (
          <ThemedText selectable style={styles.monoBlock}>
            {healthText}
          </ThemedText>
        ) : null}
        <ThemedView style={styles.apiActions}>
          <Pressable
            style={[styles.chip, { backgroundColor: chipBg }]}
            onPress={() => void runHealthCheck()}>
            <ThemedText type="defaultSemiBold">GET /api/health</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: tint }]}
            onPress={() => {
              void tokenStorage.setTokens('dev-access-token');
              void syncTokenLabel();
            }}>
            <ThemedText type="defaultSemiBold" style={styles.chipLightText}>
              Salvar token de teste
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: chipBg }]}
            onPress={() => {
              void tokenStorage.clear();
              void syncTokenLabel();
            }}>
            <ThemedText type="defaultSemiBold">Limpar tokens</ThemedText>
          </Pressable>
        </ThemedView>
      </Collapsible>
      <ThemedText>This app includes example code to help you get started.</ThemedText>
      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  apiTokenLine: {
    marginTop: 8,
  },
  apiError: {
    marginTop: 8,
    color: '#c00',
  },
  monoBlock: {
    marginTop: 8,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  spinner: {
    marginTop: 12,
  },
  apiActions: {
    marginTop: 12,
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chipLightText: {
    color: '#fff',
  },
});
