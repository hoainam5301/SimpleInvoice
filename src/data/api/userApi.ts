import { httpClient } from '../../core/network/httpClient';
import { env } from '../../core/config/env';
import type { UserResponseDto } from '../dto/UserDto';

export const userApi = {
  /**
   * Called mid-login, before `org_token` exists, so the caller passes the
   * freshly-issued `accessToken` explicitly rather than relying on the
   * request interceptor (which reads from persisted storage — empty at
   * this point). See authInterceptor's `hasExplicitAuth` guard.
   */
  async getCurrentUser(accessToken: string): Promise<UserResponseDto> {
    const response = await httpClient.get<UserResponseDto>(env.membershipMeUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },
};
