/**
 * Keychain/EncryptedStorage service & key identifiers.
 * Namespacing by "service" isolates SimpleInvoice's keychain entries from
 * any other app sharing the same device keychain.
 */
export const KEYCHAIN_SERVICE = 'com.simpleinvoice.auth';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'simpleinvoice.access_token',
  ORG_TOKEN: 'simpleinvoice.org_token',
  USER_PROFILE: 'simpleinvoice.user_profile',
} as const;
