import { Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Login } from '@/src/components/Login';

/**
 * Rota: /login
 * Implemente aqui estado, validação e submit; use o componente <Login> como casca visual.
 */
export default function LoginScreen() {
  return (
    <Login
      footer={
        <Link href="/register" asChild>
          <Pressable style={styles.footerLink} accessibilityRole="link">
            <ThemedText style={styles.footerText}>
              <ThemedText
                lightColor="#0b0b0d"
                darkColor="#0b0b0d"
                style={{ fontWeight: '500', fontSize: 15 }}>
                Não tem conta?{' '}
              </ThemedText>
              <ThemedText lightColor="#DB4437" darkColor="#DB4437" style={{ fontWeight: '700', fontSize: 16 }}>
                Cadastre-se
              </ThemedText>
            </ThemedText>
          </Pressable>
        </Link>
      }
    />
  );
}

const styles = StyleSheet.create({
  footerLink: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
  },
});
