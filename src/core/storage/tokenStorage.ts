import { secureStorage } from './secureStorage';
import { KEYCHAIN_SERVICE, STORAGE_KEYS } from '../constants/storage.constants';

export interface AuthTokens {
  accessToken: string;
  orgToken: string;
  /** Long-lived OAuth refresh token — used once to renew an expired session. */
  refreshToken?: string;
}

/**
 * Domain-agnostic token persistence. Both tokens are written as a single
 * JSON blob into ONE keychain entry — this makes read/clear atomic (no
 * window where accessToken exists but orgToken doesn't) and keeps the
 * number of native keychain calls low.
 *
 * This is the ONLY module in the app allowed to read/write auth tokens.
 * `core/network` reads through here to attach headers; nothing else should.
 */
export const tokenStorage = {
  async save(tokens: AuthTokens): Promise<void> {
    await secureStorage.setCredentials(KEYCHAIN_SERVICE, JSON.stringify(tokens));
  },

  async get(): Promise<AuthTokens | null> {
    const raw = await secureStorage.getCredentials(KEYCHAIN_SERVICE);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthTokens;
      if (!parsed.accessToken || !parsed.orgToken) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await secureStorage.clearCredentials(KEYCHAIN_SERVICE);
    await secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },
};
