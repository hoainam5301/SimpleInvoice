import Config from 'react-native-config';

/**
 * Single source of truth for build-time configuration.
 * react-native-config injects values from the active .env.* file at
 * native build time — nothing here is bundled into JS as a literal secret,
 * and none of the .env files are committed to git.
 */
export interface AppEnv {
  apiBaseUrl: string;
  authTokenUrl: string;
  membershipMeUrl: string;
  clientId: string;
  clientSecret: string;
  apiTimeoutMs: number;
  envName: 'development' | 'staging' | 'production' | 'test';
}

function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable "${key}". Check your .env.<environment> file.`,
    );
  }
  return value;
}

export const env: AppEnv = {
  apiBaseUrl: requireEnv('API_BASE_URL', Config.API_BASE_URL),
  authTokenUrl: requireEnv('AUTH_TOKEN_URL', Config.AUTH_TOKEN_URL),
  membershipMeUrl: requireEnv('MEMBERSHIP_ME_URL', Config.MEMBERSHIP_ME_URL),
  clientId: Config.CLIENT_ID ?? '',
  clientSecret: Config.CLIENT_SECRET ?? '',
  apiTimeoutMs: Number(Config.API_TIMEOUT_MS ?? 15000),
  envName: (Config.ENV_NAME as AppEnv['envName']) ?? 'development',
};
