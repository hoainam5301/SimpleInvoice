import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login as loginThunk, clearAuthError } from '../../store/slices/authSlice';
import type { LoginCredentials } from '../../domain/entities/Auth';

/**
 * Why: separates "submit the login form" (this hook) from "read whether
 * I'm logged in" (`useAuth`). LoginScreen is the only consumer, but the
 * split keeps `useAuth`'s surface small for the many screens that only
 * need `user`/`logout`, and keeps form-submission state (isLoggingIn,
 * error) out of every other screen's re-render path — `useAuth`
 * consumers don't re-render while the user is mid-keystroke on the login
 * form.
 */
export function useLogin() {
  const dispatch = useAppDispatch();
  const isLoggingIn = useAppSelector(state => state.auth.isLoggingIn);
  const error = useAppSelector(state => state.auth.error);

  const submit = useCallback(
    (credentials: LoginCredentials) => dispatch(loginThunk(credentials)),
    [dispatch],
  );

  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  return { submit, isLoggingIn, error, clearError };
}
