import * as Keychain from 'react-native-keychain';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Thin abstraction over two secure-at-rest backends:
 *
 *  - react-native-keychain: iOS Keychain / Android Keystore. Best fit for a
 *    single "credential" (we store both tokens as one JSON blob under one
 *    keychain entry, keyed by SERVICE) — hardware-backed on most devices.
 *  - react-native-encrypted-storage: AES-encrypted key/value store, used for
 *    the non-sensitive-but-not-public user profile cache.
 *
 * Nothing above this module (domain, presentation) imports Keychain or
 * EncryptedStorage directly — only `ISecureStorage` is visible upward,
 * which keeps the app portable if the backend ever changes and makes the
 * storage trivially mockable in tests.
 */
export interface ISecureStorage {
  setCredentials(service: string, secretJson: string): Promise<void>;
  getCredentials(service: string): Promise<string | null>;
  clearCredentials(service: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

class SecureStorage implements ISecureStorage {
  async setCredentials(service: string, secretJson: string): Promise<void> {
    await Keychain.setGenericPassword(service, secretJson, {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async getCredentials(service: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({ service });
    return result ? result.password : null;
  }

  async clearCredentials(service: string): Promise<void> {
    await Keychain.resetGenericPassword({ service });
  }

  async setItem(key: string, value: string): Promise<void> {
    await EncryptedStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return EncryptedStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await EncryptedStorage.removeItem(key);
  }
}

export const secureStorage: ISecureStorage = new SecureStorage();
