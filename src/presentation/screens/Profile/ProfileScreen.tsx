import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import type { MainStackParamList } from '../../navigation/types';
import { colors } from '../../../core/theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

/**
 * Read-only profile of the signed-in user. The data comes from the Redux
 * auth state, which was populated by GET /users/me during login/restore —
 * no extra network call is needed here, and the screen stays instant.
 *
 * Logout is intentionally simple (per requirement): clear the Keychain via
 * LogoutUseCase, reset auth state — RootNavigator then swaps back to the
 * Login stack automatically because `isAuthenticated` flips to false.
 */
export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const membership = user?.memberships[0];

  const initials = (user?.fullName ?? '?')
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.flex} testID="profile-screen">
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} testID="profile-name">
          {user?.fullName ?? 'Unknown user'}
        </Text>
        {membership ? (
          <Text style={styles.org} testID="profile-org">
            {membership.organizationName}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <InfoRow label="User ID" value={user?.id ?? '—'} />
        <InfoRow label="Organisation ID" value={membership?.organizationId ?? '—'} />
      </View>

      <Button label="Log out" testID="profile-logout" variant="secondary" onPress={logout} />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, gap: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.badgeBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.badgeText, fontSize: 20, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  org: { fontSize: 14, color: colors.muted, marginTop: 2 },
  divider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: 16 },
  row: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6, gap: 12 },
  rowLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  rowValue: { fontSize: 13, color: colors.ink, flexShrink: 1 },
});
