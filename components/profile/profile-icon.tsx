import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileIconName =
  | 'avatar'
  | 'edit'
  | 'notifications'
  | 'payments'
  | 'receipt'
  | 'help'
  | 'privacy'
  | 'logout'
  | 'chevronRight'
  | 'email'
  | 'id'
  | 'verified';

const PROFILE_ICON_MAP: Record<ProfileIconName, IoniconName> = {
  avatar: 'person-circle-outline',
  edit: 'create-outline',
  notifications: 'notifications-outline',
  payments: 'card-outline',
  receipt: 'receipt-outline',
  help: 'help-circle-outline',
  privacy: 'lock-closed-outline',
  logout: 'log-out-outline',
  chevronRight: 'chevron-forward',
  email: 'mail-outline',
  id: 'id-card-outline',
  verified: 'checkmark-circle',
};

type Props = {
  name: ProfileIconName;
  size?: number;
  color?: string;
};

export function ProfileIcon({ name, size = 20, color }: Props) {
  return <Ionicons name={PROFILE_ICON_MAP[name]} size={size} color={color} />;
}
