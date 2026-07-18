import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InvoiceListScreen } from '../screens/InvoiceList/InvoiceListScreen';
import { CreateInvoiceScreen } from '../screens/CreateInvoice/CreateInvoiceScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import type { MainStackParamList } from './types';
import { colors } from '../../core/theme/colors';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * InvoiceList is deliberately the FIRST screen in this stack, making it the
 * default landing screen for any authenticated session, per the "list
 * screen should be the application's default screen after authentication"
 * requirement.
 */
export function MainNavigator() {
  return (
    // Every screen draws its own gradient ScreenHeader (rounded bottom
    // corners + in-header content), which a native-stack header can't do —
    // so the native header is disabled across the stack.
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
