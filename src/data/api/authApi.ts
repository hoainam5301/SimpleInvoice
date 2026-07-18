import { authHttpClient } from '../../core/network/httpClient';
import { env } from '../../core/config/env';
import type { OAuthTokenResponseDto } from '../dto/AuthDto';
import type { LoginCredentials } from '../../domain/entities/Auth';

/**
 * Thin wrapper around ONE HTTP call. API services never contain business
 * logic or hold state — they translate a method call into a request and
 * return the raw DTO. This is the only file allowed to know the OAuth
 * token endpoint's request shape (grant_type=password, form-encoded body).
 */
export const authApi = {
  async requestToken(credentials: LoginCredentials): Promise<OAuthTokenResponseDto> {
    // Serialized by hand: Hermes' URLSearchParams.toString() is incomplete,
    // so passing a URLSearchParams instance to axios produces an empty body
    // on-device (the server then rejects with "Missing grant_type").
    const form: Record<string, string> = {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      scope: 'openid',
    };
    const body = Object.entries(form)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await authHttpClient.post<OAuthTokenResponseDto>(env.authTokenUrl, body);
    return response.data;
  },

  /**
   * Exchanges a refresh_token for a fresh access_token — lets a returning
   * user skip re-entering credentials when the short-lived (1h) access
   * token has expired but the refresh token is still valid.
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponseDto> {
    const form: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.clientId,
      client_secret: env.clientSecret,
    };
    const body = Object.entries(form)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await authHttpClient.post<OAuthTokenResponseDto>(env.authTokenUrl, body);
    return response.data;
  },
};
