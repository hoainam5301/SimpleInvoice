import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { restoreSession as restoreSessionThunk, logout as logoutThunk } from '../../store/slices/authSlice';

/**
 * Why: `authSlice` is Redux-shaped (actions, thunks, `RootState`); no screen
 * should import `useAppDispatch`/`useAppSelector` directly for auth
 * concerns — that would leak Redux's specific API into every consumer and
 * make swapping state libraries later touch every screen. `useAuth` is the
 * single facade over session state and identity.
 *
 * Responsibility: expose read-only session state + `logout()`. Login has
 * its own hook (`useLogin`) because it carries form-specific concerns
 * (submit-in-flight, field errors) that don't belong on every consumer of
 * "am I logged in".
 *
 * Triggers `restoreSession()` at most once per app process (a module-level
 * flag guards it), even though `useAuth` is called from multiple
 * components (RootNavigator, screens needing `logout`) — without the
 * guard, every mount would re-dispatch the restore thunk and cause
 * redundant `/users/me` calls and state flicker.
 */
let hasTriggeredRestore = false;

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isRestoring = useAppSelector(state => state.auth.isRestoring);

  useEffect(() => {
    if (hasTriggeredRestore) return;
    hasTriggeredRestore = true;
    dispatch(restoreSessionThunk());
  }, [dispatch]);

  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  return { user, isAuthenticated, isRestoring, logout };
}
