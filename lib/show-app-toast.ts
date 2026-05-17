import Toast from 'react-native-toast-message';

import { translateApiMessage } from '@/lib/translate-api-message';

type AppToastType = 'success' | 'error' | 'info';

type ShowAppToastParams = {
  type: AppToastType;
  text1: string;
  text2?: string;
  /** Traduz text2 se vier do backend em inglês. Padrão: true para error/info. */
  translateText2?: boolean;
  visibilityTime?: number;
};

export function showAppToast({
  type,
  text1,
  text2,
  translateText2 = type !== 'success',
  visibilityTime,
}: ShowAppToastParams): void {
  Toast.show({
    type,
    text1,
    text2: text2 && translateText2 ? translateApiMessage(text2) : text2,
    visibilityTime,
    position: 'top',
  });
}

/** Mensagem de erro da API já traduzida para exibir no toast. */
export function toastMessageFromError(
  error: unknown,
  fallback = 'Tente novamente em instantes.'
): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return translateApiMessage(msg);
    }
  }
  return fallback;
}
