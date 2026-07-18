export const API_ENDPOINTS = {
  OAUTH_TOKEN: '/oauth2/token',
  MEMBERSHIP_ME: '/membership-service/1.0.0/users/me',
  INVOICES: '/invoice-service/1.0.0/invoices',
} as const;

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  ORG_TOKEN: 'org-token',
  CONTENT_TYPE: 'Content-Type',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
