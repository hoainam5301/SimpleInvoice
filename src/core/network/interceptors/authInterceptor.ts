import type { InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../../storage/tokenStorage';
import { HTTP_HEADERS } from '../../constants/api.constants';

/**
 * Requests that must NOT carry app auth headers (the OAuth token endpoint
 * itself — sending a stale bearer token there is at best noise, at worst
 * confuses the auth server).
 */
const PUBLIC_PATHS = ['/oauth2/token'];

export async function attachAuthHeaders(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const isPublic = PUBLIC_PATHS.some(path => config.url?.includes(path));
  // A caller (e.g. the login flow's `GET /users/me`, made before any tokens
  // are persisted) may set Authorization explicitly on the request config —
  // that takes precedence over the persisted session so we never clobber it.
  const hasExplicitAuth = config.headers.has(HTTP_HEADERS.AUTHORIZATION);
  if (isPublic || hasExplicitAuth) {
    return config;
  }

  const tokens = await tokenStorage.get();
  if (tokens) {
    config.headers.set(HTTP_HEADERS.AUTHORIZATION, `Bearer ${tokens.accessToken}`);
    config.headers.set(HTTP_HEADERS.ORG_TOKEN, tokens.orgToken);
  }

  return config;
}
