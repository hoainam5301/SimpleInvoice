import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/presentation/screens/Login/LoginScreen';
import { useLogin } from '../../src/presentation/hooks/useLogin';

/**
 * The screen is tested against a mocked `useLogin` — the hook's own
 * behavior (dispatching the thunk, deriving loading/error state) is
 * exercised separately as a unit; here we only verify the screen renders
 * correctly and calls the hook's `submit` with the form's validated
 * values, which is the actual contract between screen and hook.
 */
jest.mock('../../src/presentation/hooks/useLogin');

const mockedUseLogin = useLogin as jest.MockedFunction<typeof useLogin>;

function setupUseLogin(overrides: Partial<ReturnType<typeof useLogin>> = {}) {
  mockedUseLogin.mockReturnValue({
    submit: jest.fn(),
    isLoggingIn: false,
    error: null,
    clearError: jest.fn(),
    ...overrides,
  });
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username and password fields and a sign-in button', () => {
    setupUseLogin();
    render(<LoginScreen />);

    expect(screen.getByTestId('login-username')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByTestId('login-submit')).toBeTruthy();
  });

  it('shows validation errors and does not call submit when fields are empty', async () => {
    const submit = jest.fn();
    setupUseLogin({ submit });
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-username-error')).toBeTruthy();
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it('calls submit with the entered credentials once validation passes', async () => {
    const submit = jest.fn();
    setupUseLogin({ submit });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('login-username'), 'jane.doe');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({ username: 'jane.doe', password: 'password123' });
    });
  });

  it('toggles password visibility when the show/hide button is pressed', () => {
    setupUseLogin();
    render(<LoginScreen />);

    const password = screen.getByTestId('login-password');
    const toggle = screen.getByTestId('login-password-toggle');

    // Masked by default.
    expect(password.props.secureTextEntry).toBe(true);

    fireEvent.press(toggle);
    expect(password.props.secureTextEntry).toBe(false);

    fireEvent.press(toggle);
    expect(password.props.secureTextEntry).toBe(true);
  });

  it('renders the server error banner when the hook reports an error', () => {
    setupUseLogin({ error: 'Invalid username or password.' });
    render(<LoginScreen />);

    expect(screen.getByTestId('login-error')).toBeTruthy();
    expect(screen.getByText('Invalid username or password.')).toBeTruthy();
  });

  it('disables interaction and shows a spinner while logging in', () => {
    setupUseLogin({ isLoggingIn: true });
    render(<LoginScreen />);

    expect(screen.getByTestId('login-submit').props.accessibilityState.busy).toBe(true);
  });
});
