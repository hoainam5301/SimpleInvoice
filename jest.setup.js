jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// LinearGradient is a native view; in Jest render it as a plain View so
// component trees using the gradient header/buttons stay testable.
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api-neobank-dev.101digital.io',
  AUTH_TOKEN_URL: 'https://is-wso2-dev.101digital.io/t/101digital.core/oauth2/token',
  MEMBERSHIP_ME_URL: 'https://api-neobank-dev.101digital.io/membership-service/1.0.0/users/me',
  CLIENT_ID: 'test-client-id',
  CLIENT_SECRET: 'test-client-secret',
  API_TIMEOUT_MS: '15000',
  ENV_NAME: 'test',
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
  ACCESS_CONTROL: {},
}));

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
