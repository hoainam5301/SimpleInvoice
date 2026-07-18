declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    AUTH_TOKEN_URL?: string;
    MEMBERSHIP_ME_URL?: string;
    CLIENT_ID?: string;
    CLIENT_SECRET?: string;
    API_TIMEOUT_MS?: string;
    ENV_NAME?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
