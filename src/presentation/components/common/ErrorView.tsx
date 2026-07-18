import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '../../../core/theme/colors';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorView({ message, onRetry, testID }: ErrorViewProps) {
  return (
    <View style={styles.container} testID={testID ?? 'error-view'}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 8 },
});
