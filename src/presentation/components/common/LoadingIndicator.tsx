import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../../core/theme/colors';

export function LoadingIndicator({ testID }: { testID?: string }) {
  return (
    <View style={styles.container} testID={testID ?? 'loading-indicator'}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
