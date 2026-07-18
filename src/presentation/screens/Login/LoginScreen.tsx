import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '../../components/common/TextField';
import { Button } from '../../components/common/Button';
import { useLogin } from '../../hooks/useLogin';
import { loginSchema, type LoginFormValues } from './schema';
import { styles } from './LoginScreen.styles';

export function LoginScreen() {
  const { submit, isLoggingIn, error, clearError } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = (values: LoginFormValues) => {
    clearError();
    submit(values);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>101 DIGITAL</Text>
        </View>
        <Text style={styles.title}>
          Simple<Text style={styles.titleAccent}>Invoice</Text>
        </Text>
        <Text style={styles.subtitle}>Sign in to manage your invoices</Text>

        <View style={styles.card}>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Username"
              testID="login-username"
              autoCapitalize="none"
              autoComplete="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.username?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
              testID="login-password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.password?.message}
            />
          )}
        />

        {error ? (
          <View style={styles.errorBanner} testID="login-error">
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label="Sign in"
          testID="login-submit"
          isLoading={isLoggingIn}
          onPress={handleSubmit(onSubmit)}
        />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
