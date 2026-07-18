import { StyleSheet } from 'react-native';
import { colors } from '../../../core/theme/colors';

export const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.badgeBackground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  logoBadgeText: {
    color: colors.badgeText,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { fontSize: 32, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  titleAccent: { color: colors.accentText },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
