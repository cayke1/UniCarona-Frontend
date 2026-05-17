import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { ApiError, formatApiValidationFields, userApi } from '@/lib/api';
import { isLocalPhotoUri, pickProfilePhoto } from '@/lib/pick-profile-photo';
import { getProfileExtras, setProfileExtras } from '@/lib/profile-extras-preferences';
import { showAppToast } from '@/lib/show-app-toast';
import { isDriverUser } from '@/lib/user-types';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EditProfileScreen() {
  const { user, setUserFromServerResponse } = useUser();
  const isDriver = user ? isDriverUser(user) : false;

  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [institution, setInstitution] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const extras = await getProfileExtras();
      if (cancelled) return;
      setName(user?.name ?? '');
      setMajor(extras.major || user?.major || '');
      setInstitution(extras.institution || user?.institution || '');
      setPixKey(user?.pixKey ?? '');
      const initialPhoto = extras.localPhotoUri?.trim() || user?.photoUrl?.trim() || null;
      setPhotoUri(initialPhoto);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onPickPhoto = useCallback(async () => {
    setPickingPhoto(true);
    try {
      const uri = await pickProfilePhoto();
      if (uri) setPhotoUri(uri);
    } finally {
      setPickingPhoto(false);
    }
  }, []);

  const onRemovePhoto = useCallback(() => {
    Alert.alert('Remover foto', 'Deseja remover a foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => setPhotoUri(null),
      },
    ]);
  }, []);

  const onSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      showAppToast({
        type: 'error',
        text1: 'Nome inválido',
        text2: 'Informe seu nome completo.',
        translateText2: false,
      });
      return;
    }

    setSaving(true);
    try {
      const payload: { name: string; pixKey?: string } = { name: trimmedName };
      const trimmedPix = pixKey.trim();
      if (isDriver && trimmedPix) payload.pixKey = trimmedPix;

      const res = await userApi.patchMe(payload);
      setUserFromServerResponse(res as Record<string, unknown>);

      const localPhoto = photoUri && isLocalPhotoUri(photoUri) ? photoUri : '';

      await setProfileExtras({
        major: major.trim(),
        institution: institution.trim(),
        localPhotoUri: localPhoto,
      });

      showAppToast({
        type: 'success',
        text1: 'Perfil atualizado',
        text2: localPhoto
          ? 'Foto salva neste dispositivo. Envio ao servidor virá em breve.'
          : 'Suas alterações foram salvas.',
        translateText2: false,
      });
    } catch (e) {
      const validation = e instanceof ApiError ? formatApiValidationFields(e.body) : null;
      showAppToast({
        type: 'error',
        text1: 'Não foi possível salvar',
        text2: validation ?? (e instanceof ApiError ? e.message : 'Tente novamente.'),
        translateText2: false,
      });
    } finally {
      setSaving(false);
    }
  }, [name, major, institution, pixKey, photoUri, isDriver, setUserFromServerResponse]);

  return (
    <SupportScreenLayout title="Editar perfil" subtitle="Campus Ride · sua conta">
      <>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="person-outline" size={28} color={supportUi.BRAND_BLUE} />
          </View>
          <Text style={styles.heroTitle}>Dados da conta</Text>
          <Text style={styles.heroSub}>
            Atualize como você aparece para outros estudantes. O e-mail institucional não pode ser
            alterado aqui.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={supportUi.BRAND_BLUE} />
          </View>
        ) : (
          <>
            <Text style={supportUi.sectionLabel}>FOTO DE PERFIL</Text>
            <View style={styles.photoCard}>
              <Pressable
                style={({ pressed }) => [styles.photoTap, pressed && styles.photoTapPressed]}
                onPress={() => void onPickPhoto()}
                disabled={pickingPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} contentFit="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoInitials}>{initialsFromName(name || user?.name || '')}</Text>
                  </View>
                )}
                <View style={styles.photoBadge}>
                  {pickingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
              <Text style={styles.photoHint}>
                Toque na foto para escolher da galeria ou tirar uma nova. Pedimos permissão na hora.
              </Text>
              <View style={styles.photoActions}>
                <Pressable
                  style={({ pressed }) => [styles.photoActionBtn, pressed && styles.photoActionBtnPressed]}
                  onPress={() => void onPickPhoto()}
                  disabled={pickingPhoto}>
                  <Ionicons name="images-outline" size={18} color={supportUi.BRAND_BLUE} />
                  <Text style={styles.photoActionText}>Escolher foto</Text>
                </Pressable>
                {photoUri ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.photoActionBtn,
                      styles.photoActionBtnDanger,
                      pressed && styles.photoActionBtnPressed,
                    ]}
                    onPress={onRemovePhoto}>
                    <Ionicons name="trash-outline" size={18} color={colors.error[700]} />
                    <Text style={[styles.photoActionText, styles.photoActionTextDanger]}>Remover</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Text style={supportUi.sectionLabel}>INFORMAÇÕES PESSOAIS</Text>
            <View style={styles.formCard}>
              <AuthTextField
                icon="person-outline"
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <View style={styles.readOnlyField}>
                <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} />
                <View style={styles.readOnlyBody}>
                  <Text style={styles.readOnlyLabel}>E-mail</Text>
                  <Text style={styles.readOnlyValue}>{user?.email ?? '—'}</Text>
                </View>
              </View>
              <AuthTextField
                icon="school-outline"
                placeholder="Curso / programa"
                value={major}
                onChangeText={setMajor}
                autoCapitalize="words"
              />
              <AuthTextField
                icon="business-outline"
                placeholder="Instituição de ensino"
                value={institution}
                onChangeText={setInstitution}
                autoCapitalize="words"
              />
            </View>

            {isDriver ? (
              <>
                <Text style={supportUi.sectionLabel}>MOTORISTA</Text>
                <View style={styles.formCard}>
                  <AuthTextField
                    icon="qr-code-outline"
                    placeholder="Chave PIX para receber"
                    value={pixKey}
                    onChangeText={setPixKey}
                    autoCapitalize="none"
                  />
                </View>
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                (saving || pressed) && styles.primaryBtnPressed,
                saving && styles.primaryBtnDisabled,
              ]}
              onPress={() => void onSave()}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Salvar alterações</Text>
                </>
              )}
            </Pressable>

            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning[700]} />
              <Text style={styles.tipText}>
                A foto fica salva neste aparelho por enquanto. O envio ao servidor será integrado
                depois; curso e instituição também ficam locais até lá.
              </Text>
            </View>
          </>
        )}
      </>
    </SupportScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing[2],
  },
  loadingBox: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  photoCard: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[3],
  },
  photoTap: {
    position: 'relative',
  },
  photoTapPressed: {
    opacity: 0.92,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: supportUi.BRAND_BLUE,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: supportUi.BRAND_BLUE,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: supportUi.BRAND_BLUE,
  },
  photoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: supportUi.BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.surface,
  },
  photoHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing[2],
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.muted,
    backgroundColor: colors.background.surface,
  },
  photoActionBtnDanger: {
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  photoActionBtnPressed: {
    opacity: 0.88,
  },
  photoActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: supportUi.BRAND_BLUE,
  },
  photoActionTextDanger: {
    color: colors.error[700],
  },
  formCard: {
    ...supportUi.card,
    gap: spacing[3],
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.muted,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  readOnlyBody: {
    flex: 1,
    gap: 2,
  },
  readOnlyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.semiBold,
  },
  readOnlyValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: supportUi.BRAND_BLUE,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.warning[800],
    lineHeight: 18,
  },
});
