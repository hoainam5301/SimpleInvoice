import * as Keychain from 'react-native-keychain';
import { AuthRepositoryImpl } from '../../../src/data/repositories/AuthRepositoryImpl';
import { authApi } from '../../../src/data/api/authApi';
import { userApi } from '../../../src/data/api/userApi';
import { tokenStorage } from '../../../src/core/storage/tokenStorage';

jest.mock('../../../src/data/api/authApi');
jest.mock('../../../src/data/api/userApi');

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedUserApi = userApi as jest.Mocked<typeof userApi>;

// In-memory Keychain so tokenStorage round-trips what it saves.
let storedCredential: { username: string; password: string } | false = false;
(Keychain.setGenericPassword as jest.Mock).mockImplementation(async (username, password) => {
  storedCredential = { username, password };
  return true;
});
(Keychain.getGenericPassword as jest.Mock).mockImplementation(async () => storedCredential);
(Keychain.resetGenericPassword as jest.Mock).mockImplementation(async () => {
  storedCredential = false;
  return true;
});

const userDto = {
  data: {
    userId: 'u1',
    fullName: 'James Vand',
    memberships: [
      { membershipId: 'm1', organisationId: 'o1', organisationName: 'James Corp', token: 'org-1' },
    ],
  },
};

describe('AuthRepositoryImpl.restoreSession — refresh token flow', () => {
  const repository = new AuthRepositoryImpl();

  beforeEach(() => {
    jest.clearAllMocks();
    storedCredential = false;
  });

  it('silently renews the session with the refresh token when the access token expired', async () => {
    await tokenStorage.save({ accessToken: 'expired', orgToken: 'org-1', refreshToken: 'rt-1' });
    // First /users/me call (with the stale token) fails; the retry after
    // the refresh grant succeeds.
    mockedUserApi.getCurrentUser
      .mockRejectedValueOnce(new Error('401'))
      .mockResolvedValueOnce(userDto);
    mockedAuthApi.refreshToken.mockResolvedValueOnce({
      access_token: 'fresh',
      refresh_token: 'rt-2',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const session = await repository.restoreSession();

    expect(session?.accessToken).toBe('fresh');
    expect(mockedAuthApi.refreshToken).toHaveBeenCalledWith('rt-1');
    // Rotated refresh token is persisted for the next renewal.
    await expect(tokenStorage.get()).resolves.toMatchObject({
      accessToken: 'fresh',
      refreshToken: 'rt-2',
    });
  });

  it('clears the keychain and returns null when the refresh grant also fails', async () => {
    await tokenStorage.save({ accessToken: 'expired', orgToken: 'org-1', refreshToken: 'rt-dead' });
    mockedUserApi.getCurrentUser.mockRejectedValue(new Error('401'));
    mockedAuthApi.refreshToken.mockRejectedValue(new Error('invalid_grant'));

    const session = await repository.restoreSession();

    expect(session).toBeNull();
    await expect(tokenStorage.get()).resolves.toBeNull();
  });
});
