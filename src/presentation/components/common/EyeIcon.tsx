import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../core/theme/colors';

interface EyeIconProps {
  /** When true, renders the "hidden" variant (eye with a slash through it). */
  off?: boolean;
  color?: string;
  size?: number;
}

/**
 * A small eye / eye-off glyph drawn with plain Views so the app needs no
 * icon-font or SVG dependency (which would force a native rebuild). Used by
 * the password field's show/hide toggle.
 */
export function EyeIcon({ off = false, color = colors.muted, size = 22 }: EyeIconProps) {
  const scale = size / 22;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.eye,
          {
            width: 20 * scale,
            height: 12 * scale,
            borderRadius: 6 * scale,
            borderWidth: 1.8 * scale,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.pupil,
          {
            width: 6 * scale,
            height: 6 * scale,
            borderRadius: 3 * scale,
            backgroundColor: color,
          },
        ]}
      />
      {off ? (
        <View
          style={[
            styles.slash,
            {
              width: 26 * scale,
              height: 1.8 * scale,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  eye: { position: 'absolute' },
  pupil: { position: 'absolute' },
  slash: { position: 'absolute' },
});
