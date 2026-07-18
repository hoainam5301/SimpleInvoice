import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../../store';
import { useAppDispatch } from '../../store/hooks';
import { sessionExpired } from '../../store/slices/authSlice';
import { sessionEvents } from '../../core/network/sessionEvents';

/**
 * Bridges `core/network`'s framework-agnostic `sessionEvents` bus to Redux.
 * This is the ONLY place the two are wired together — it's what lets
 * `httpClient`'s response interceptor announce "got a 401" without ever
 * importing the store (core must not depend on store; see ARCHITECTURE.md).
 */
function SessionExpiredBridge({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    return sessionEvents.onSessionExpired(() => {
      dispatch(sessionExpired());
    });
  }, [dispatch]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <SessionExpiredBridge>{children}</SessionExpiredBridge>
      </SafeAreaProvider>
    </Provider>
  );
}
