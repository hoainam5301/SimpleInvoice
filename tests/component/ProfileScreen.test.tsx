import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileScreen } from '../../src/presentation/screens/Profile/ProfileScreen';
import { useAuth } from '../../src/presentation/hooks/useAuth';

jest.mock('../../src/presentation/hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type Props = React.ComponentProps<typeof ProfileScreen>;
const navigation = { goBack: jest.fn() } as unknown as Props['navigation'];
const route = { key: 'Profile', name: 'Profile' } as Props['route'];

describe('ProfileScreen', () => {
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        fullName: 'James Vand',
        memberships: [
          { organizationId: 'o1', organizationName: 'James Corp', token: 'org-token' },
        ],
      },
      isAuthenticated: true,
      isRestoring: false,
      logout,
    });
  });

  it('renders the signed-in user and their organisation', () => {
    render(<ProfileScreen navigation={navigation} route={route} />);

    expect(screen.getByTestId('profile-name')).toHaveTextContent('James Vand');
    expect(screen.getByTestId('profile-org')).toHaveTextContent('James Corp');
  });

  it('calls logout when the Log out button is pressed', () => {
    render(<ProfileScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByTestId('profile-logout'));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
