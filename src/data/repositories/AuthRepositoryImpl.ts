import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { AuthSession, LoginCredentials } from '../../domain/entities/Auth';
import type { User } from '../../domain/entities/User';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { mapUserDtoToEntity } from '../mappers/authMapper';
import { tokenStorage } from '../../core/storage/tokenStorage';
import { ApiError, ApiErrorType } from '../../core/network/apiError';

/**
 * Concrete adapter satisfying the `AuthRepository` port. This is the ONLY
 * place that sequences "token endpoint -> users/me -> extract org token ->
 * persist to Keychain" — orchestration the domain use case delegates to it
 * because it's inherently tied to this backend's specific two-call contract.
 */
export class AuthRepositoryImpl implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const tokenResponse = await authApi.requestToken(credentials);
    const accessToken = tokenResponse.access_token;

    const userDto = await userApi.getCurrentUser(accessToken);
    const membership = userDto.data?.memberships?.[0];

    if (!membership?.token) {
      throw new ApiError({
        type: ApiErrorType.UNKNOWN,
        message: 'No organization membership found for this account.',
      });
    }

    const orgToken = membership.token;
    await tokenStorage.save({ accessToken, orgToken, refreshToken: tokenResponse.refresh_token });

    const user: User = mapUserDtoToEntity(userDto);
    return { user, accessToken, orgToken };
  }

  async logout(): Promise<void> {
    await tokenStorage.clear();
  }

  async restoreSession(): Promise<AuthSession | null> {
    const tokens = await tokenStorage.get();
    if (!tokens) return null;

    try {
      const userDto = await userApi.getCurrentUser(tokens.accessToken);
      return {
        user: mapUserDtoToEntity(userDto),
        accessToken: tokens.accessToken,
        orgToken: tokens.orgToken,
      };
    } catch {
      // Access token likely expired (they live 1h). Before forcing a fresh
      // login, try the refresh_token grant once — success means the user
      // resumes silently; failure means the session is truly dead.
      const renewed = tokens.refreshToken
        ? await this.tryRefresh(tokens.refreshToken, tokens.orgToken)
        : null;
      if (renewed) return renewed;

      // Persisted tokens are no longer valid (expired/revoked) — clear them
      // so the user lands cleanly on the login screen instead of a stuck
      // "restoring session" state.
      await tokenStorage.clear();
      return null;
    }
  }

  private async tryRefresh(refreshToken: string, orgToken: string): Promise<AuthSession | null> {
    try {
      const tokenResponse = await authApi.refreshToken(refreshToken);
      const accessToken = tokenResponse.access_token;
      const userDto = await userApi.getCurrentUser(accessToken);
      // The WSO2 sandbox rotates refresh tokens — persist the new one.
      await tokenStorage.save({
        accessToken,
        orgToken,
        refreshToken: tokenResponse.refresh_token ?? refreshToken,
      });
      return { user: mapUserDtoToEntity(userDto), accessToken, orgToken };
    } catch {
      return null;
    }
  }

  async getCurrentUser(): Promise<User> {
    const tokens = await tokenStorage.get();
    if (!tokens) {
      throw new ApiError({ type: ApiErrorType.UNAUTHORIZED, message: 'No active session.' });
    }
    const userDto = await userApi.getCurrentUser(tokens.accessToken);
    return mapUserDtoToEntity(userDto);
  }
}
