import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { showAppToast } from '@/lib/show-app-toast';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export function isLocalPhotoUri(uri: string): boolean {
  const u = uri.trim().toLowerCase();
  return (
    u.startsWith('file:') ||
    u.startsWith('content:') ||
    u.startsWith('ph://') ||
    u.startsWith('assets-library:')
  );
}

async function pickFromLibrary(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    showAppToast({
      type: 'error',
      text1: 'Permissão negada',
      text2: 'Ative o acesso às fotos nas configurações do dispositivo.',
      translateText2: false,
    });
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

async function pickFromCamera(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showAppToast({
      type: 'error',
      text1: 'Permissão negada',
      text2: 'Ative o acesso à câmera nas configurações do dispositivo.',
      translateText2: false,
    });
    return null;
  }

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

/** Abre galeria ou câmera (com permissões) e devolve a URI local da imagem. */
export function pickProfilePhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const options: Array<{
      text: string;
      style?: 'cancel' | 'default' | 'destructive';
      onPress?: () => void;
    }> = [
      {
        text: 'Galeria de fotos',
        onPress: () => {
          void pickFromLibrary().then(resolve);
        },
      },
    ];

    if (Platform.OS !== 'web') {
      options.push({
        text: 'Tirar foto',
        onPress: () => {
          void pickFromCamera().then(resolve);
        },
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
      onPress: () => resolve(null),
    });

    Alert.alert('Foto de perfil', 'Escolha como adicionar sua foto', options, {
      cancelable: true,
      onDismiss: () => resolve(null),
    });
  });
}
