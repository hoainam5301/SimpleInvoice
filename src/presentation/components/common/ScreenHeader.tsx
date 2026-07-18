import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../core/theme/colors';
import { GradientSurface } from './GradientSurface';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Rendered at the far right (e.g. the avatar button on the list screen). */
  right?: React.ReactNode;
  /** Extra content inside the gradient, under the title row (e.g. search). */
  children?: React.ReactNode;
}

/**
 * The redesign's signature gradient header (orange→pink, rounded bottom
 * corners). Screens render this themselves with `headerShown: false` —
 * a native-stack header can't host the gradient + in-header search field
 * the design calls for.
 */
export function ScreenHeader({ title, onBack, right, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <GradientSurface style={[styles.container, { paddingTop: insets.top + 14 }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          {onBack ? (
            <Pressable
              testID="header-back"
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={10}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 2 },
  backArrow: { color: colors.onPrimary, fontSize: 22, fontWeight: '800' },
  title: { color: colors.onPrimary, fontSize: 22, fontWeight: '800' },
});
