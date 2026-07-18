import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors } from '../../../core/theme/colors';
import { EyeIcon } from './EyeIcon';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string;
  testID?: string;
}

/**
 * Reusable, uncontrolled-friendly form control designed to be driven by
 * React Hook Form's `<Controller>` (see LoginScreen / CreateInvoiceScreen):
 * it forwards all standard TextInput props and renders RHF/Zod field
 * errors consistently everywhere a field appears.
 *
 * When `secureTextEntry` is set, an inline show/hide toggle is rendered so
 * the user can reveal what they typed — masking is owned here (internal
 * `isRevealed` state) rather than by each caller, so every password field in
 * the app gets the same affordance for free.
 */
export function TextField({
  label,
  errorMessage,
  testID,
  style,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          style={[styles.input, style]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry ? !isRevealed : false}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            testID={testID ? `${testID}-toggle` : undefined}
            accessibilityRole="button"
            accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: isRevealed }}
            hitSlop={8}
            onPress={() => setIsRevealed(prev => !prev)}
            style={styles.toggle}
          >
            <EyeIcon off={!isRevealed} />
          </Pressable>
        ) : null}
      </View>
      {errorMessage ? (
        <Text style={styles.error} testID={testID ? `${testID}-error` : undefined}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  toggle: { paddingLeft: 12, paddingVertical: 4 },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
});
