import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingIndicator } from '../components/common/LoadingIndicator';

/**
 * The auth/main split IS the enforcement mechanism for "no direct API
 * calls from an unauthenticated screen can reach the org-scoped API" —
 * MainNavigator (and everything under it) simply doesn't mount until
 * `isAuthenticated` is true, so InvoiceList/CreateInvoice never render
 * without a session.
 */
export function RootNavigator() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <LoadingIndicator testID="app-restoring-session" />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
