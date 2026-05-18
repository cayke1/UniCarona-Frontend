import { getJsonPreference, setJsonPreference } from '@/lib/local-preferences';

const KEY = 'unicarona_notification_preferences';

export type NotificationPreferences = {
  rideUpdates: boolean;
  paymentUpdates: boolean;
  requestUpdates: boolean;
  promotions: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  rideUpdates: true,
  paymentUpdates: true,
  requestUpdates: true,
  promotions: false,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return getJsonPreference(KEY, DEFAULT_NOTIFICATION_PREFERENCES);
}

export async function setNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await setJsonPreference(KEY, prefs);
}
