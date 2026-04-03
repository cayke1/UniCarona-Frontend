import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

/** Logo colorido do Google (PNG oficial em `assets/images/google-g.png`). */
const googleIcon = require('../../assets/images/google-g.png');

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function GoogleLogo({ size = 22, style }: Props) {
  return (
    <Image
      source={googleIcon}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityLabel="Google"
    />
  );
}
