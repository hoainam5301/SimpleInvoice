import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/theme/colors';
import { GradientSurface } from './GradientSurface';

interface ButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  testID?: string;
}

/**
 * Primary = the redesign's gradient pill (orange→pink). Secondary = warm
 * badge-toned pill (used for Log out / Try again).
 */
export function Button({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  testID,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const content = isLoading ? (
    <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.badgeText} />
  ) : (
    <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>{label}</Text>
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed]}
    >
      {variant === 'primary' ? (
        <GradientSurface style={styles.base}>{content}</GradientSurface>
      ) : (
        <View style={[styles.base, styles.secondary]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondary: { backgroundColor: colors.badgeBackground },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  secondaryText: { color: colors.badgeText, fontSize: 15, fontWeight: '800' },
});
