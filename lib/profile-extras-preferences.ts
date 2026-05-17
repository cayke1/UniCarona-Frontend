import { getJsonPreference, setJsonPreference } from '@/lib/local-preferences';

const KEY = 'unicarona_profile_extras';

export type ProfileExtras = {
  major: string;
  institution: string;
  /** URI local (galeria/câmera) até existir upload no backend. */
  localPhotoUri: string;
};

export const EMPTY_PROFILE_EXTRAS: ProfileExtras = {
  major: '',
  institution: '',
  localPhotoUri: '',
};

export async function getProfileExtras(): Promise<ProfileExtras> {
  return getJsonPreference(KEY, EMPTY_PROFILE_EXTRAS);
}

export async function setProfileExtras(extras: ProfileExtras): Promise<void> {
  await setJsonPreference(KEY, extras);
}
