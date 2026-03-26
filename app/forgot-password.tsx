import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** Tela placeholder — implemente recuperação de senha aqui */
export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Esqueceu a senha?</ThemedText>
      <ThemedText style={styles.hint}>Em breve: fluxo de redefinição por e-mail.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
