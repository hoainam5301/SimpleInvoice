import type { AxiosError } from 'axios';
import { ApiError, ApiErrorType } from '../apiError';

interface ServerErrorBody {
  message?: string;
  error_description?: string;
  errors?: Record<string, string[]>;
}

/**
 * Maps every failure mode (HTTP 4xx/5xx, timeout, no connectivity) to a
 * single ApiError shape. This is the ONE place in the app that inspects
 * `axios`-specific error internals — everything downstream works with
 * ApiError only.
 */
export function mapAxiosErrorToApiError(rawError: AxiosError<unknown>): ApiError {
  const error = rawError as AxiosError<ServerErrorBody>;
  if (error.code === 'ECONNABORTED') {
    return new ApiError({
      type: ApiErrorType.TIMEOUT,
      message: 'The request timed out. Please check your connection and try again.',
      cause: error,
    });
  }

  if (!error.response) {
    return new ApiError({
      type: ApiErrorType.NETWORK,
      message: 'Unable to reach the server. Please check your network connection.',
      cause: error,
    });
  }

  const { status, data } = error.response;
  const serverMessage = data?.message ?? data?.error_description;

  switch (status) {
    case 400:
    case 422:
      return new ApiError({
        type: ApiErrorType.VALIDATION,
        message: serverMessage ?? 'The submitted data is invalid.',
        status,
        fieldErrors: data?.errors,
        cause: error,
      });
    case 401:
      return new ApiError({
        type: ApiErrorType.UNAUTHORIZED,
        message: serverMessage ?? 'Your session has expired. Please sign in again.',
        status,
        cause: error,
      });
    case 403:
      return new ApiError({
        type: ApiErrorType.FORBIDDEN,
        message: serverMessage ?? 'You do not have permission to perform this action.',
        status,
        cause: error,
      });
    case 404:
      return new ApiError({
        type: ApiErrorType.NOT_FOUND,
        message: serverMessage ?? 'The requested resource was not found.',
        status,
        cause: error,
      });
    default:
      if (status >= 500) {
        return new ApiError({
          type: ApiErrorType.SERVER,
          message: serverMessage ?? 'Something went wrong on our end. Please try again shortly.',
          status,
          cause: error,
        });
      }
      return new ApiError({
        type: ApiErrorType.UNKNOWN,
        message: serverMessage ?? 'An unexpected error occurred.',
        status,
        cause: error,
      });
  }
}
