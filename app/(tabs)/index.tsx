import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        UniCarona
      </ThemedText>
      <ThemedText style={styles.subtitle}>Carpooling para a universidade</ThemedText>

      <View style={styles.actions}>
        <Link href="/login" asChild>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.buttonText}>Entrar</ThemedText>
          </Pressable>
        </Link>
        <Link href="/register" asChild>
          <Pressable style={({ pressed }) => [styles.buttonOutline, pressed && styles.buttonPressed]}>
            <ThemedText
              lightColor="#0b0b0d"
              darkColor="#f8fafc"
              style={styles.buttonOutlineText}>
              Criar conta
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  button: {
    backgroundColor: '#0b0b0d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
