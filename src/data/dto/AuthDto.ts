/** Shape returned by POST /oauth2/token (WSO2 IS). */
export interface OAuthTokenResponseDto {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}
