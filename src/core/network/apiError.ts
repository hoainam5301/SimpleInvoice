/**
 * Centralized, transport-agnostic error shape. Every layer above `core/network`
 * (repositories, use cases, hooks, screens) only ever sees `ApiError` — never
 * a raw AxiosError — so swapping HTTP clients later doesn't ripple upward.
 */
export enum ApiErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED', // 401
  FORBIDDEN = 'FORBIDDEN', // 403
  NOT_FOUND = 'NOT_FOUND', // 404
  VALIDATION = 'VALIDATION', // 400 / 422
  SERVER = 'SERVER', // 5xx
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK', // no connectivity / request never reached server
  UNKNOWN = 'UNKNOWN',
}

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly cause?: unknown;

  constructor(params: {
    type: ApiErrorType;
    message: string;
    status?: number;
    fieldErrors?: Record<string, string[]>;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.type = params.type;
    this.status = params.status;
    this.fieldErrors = params.fieldErrors;
    this.cause = params.cause;
  }

  get isAuthError(): boolean {
    return this.type === ApiErrorType.UNAUTHORIZED || this.type === ApiErrorType.FORBIDDEN;
  }
}
