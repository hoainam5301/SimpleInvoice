import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../core/theme/colors';

interface GradientSurfaceProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A View whose background is the brand orange→pink gradient.
 *
 * The gradient is painted as an absolutely-positioned fill BEHIND a normal
 * View, rather than being used as the layout container itself. This is
 * deliberate: react-native-linear-gradient (2.8.x) is a legacy (pre-Fabric)
 * native component and, under the New Architecture's Fabric interop on iOS,
 * it does not reliably size itself to its flex children — used directly as a
 * container it collapses/clips its content (Android's interop is unaffected,
 * which is why the bug is iOS-only). Letting a plain View own the layout —
 * which iOS measures correctly — and painting the gradient behind it fixes
 * this on both platforms and both architectures.
 *
 * `overflow: 'hidden'` clips the gradient to the wrapper's border radius.
 */
export function GradientSurface({ style, children }: GradientSurfaceProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={[...colors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
});
