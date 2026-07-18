import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { env } from '../config/env';
import { attachAuthHeaders } from './interceptors/authInterceptor';
import { mapAxiosErrorToApiError } from './interceptors/errorInterceptor';
import { sessionEvents } from './sessionEvents';
import { ApiErrorType } from './apiError';
import { logger } from '../utils/logger';

/**
 * Single Axios instance for the whole app. Every Data-layer API service
 * (see src/data/api/*) imports this — none of them construct their own
 * axios instance, so header injection and error mapping are guaranteed
 * consistent everywhere.
 */
function createHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: env.apiTimeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(attachAuthHeaders, error => Promise.reject(error));

  instance.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      const apiError = mapAxiosErrorToApiError(error);

      logger.warn('[http] request failed', {
        url: error.config?.url,
        status: apiError.status,
        type: apiError.type,
      });

      if (apiError.type === ApiErrorType.UNAUTHORIZED) {
        sessionEvents.emitSessionExpired();
      }

      return Promise.reject(apiError);
    },
  );

  return instance;
}

export const httpClient = createHttpClient();

/**
 * A second, unauthenticated instance for the OAuth token exchange, which
 * uses `application/x-www-form-urlencoded` and must never carry a stale
 * bearer token from a previous session.
 */
export const authHttpClient = axios.create({
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

authHttpClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => Promise.reject(mapAxiosErrorToApiError(error)),
);
