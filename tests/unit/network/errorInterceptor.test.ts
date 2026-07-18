import type { AxiosError } from 'axios';
import { mapAxiosErrorToApiError } from '../../../src/core/network/interceptors/errorInterceptor';
import { ApiErrorType } from '../../../src/core/network/apiError';

function axiosError(partial: Partial<AxiosError<unknown>>): AxiosError<unknown> {
  return partial as AxiosError<unknown>;
}

function withResponse(status: number, data?: unknown): AxiosError<unknown> {
  return axiosError({ response: { status, data } as AxiosError['response'] });
}

describe('mapAxiosErrorToApiError', () => {
  it('maps a timeout (ECONNABORTED)', () => {
    const e = mapAxiosErrorToApiError(axiosError({ code: 'ECONNABORTED' }));
    expect(e.type).toBe(ApiErrorType.TIMEOUT);
  });

  it('maps a missing response to NETWORK', () => {
    const e = mapAxiosErrorToApiError(axiosError({}));
    expect(e.type).toBe(ApiErrorType.NETWORK);
  });

  it.each([
    [400, ApiErrorType.VALIDATION],
    [422, ApiErrorType.VALIDATION],
    [401, ApiErrorType.UNAUTHORIZED],
    [403, ApiErrorType.FORBIDDEN],
    [404, ApiErrorType.NOT_FOUND],
    [500, ApiErrorType.SERVER],
    [503, ApiErrorType.SERVER],
    [418, ApiErrorType.UNKNOWN],
  ])('maps HTTP %i to %s', (status, expected) => {
    expect(mapAxiosErrorToApiError(withResponse(status)).type).toBe(expected);
  });

  it('prefers the server-provided message and field errors on a validation error', () => {
    const e = mapAxiosErrorToApiError(
      withResponse(422, { message: 'Bad field', errors: { email: ['required'] } }),
    );
    expect(e.message).toBe('Bad field');
    expect(e.fieldErrors).toEqual({ email: ['required'] });
    expect(e.status).toBe(422);
  });

  it('falls back to error_description when message is absent', () => {
    const e = mapAxiosErrorToApiError(withResponse(401, { error_description: 'token expired' }));
    expect(e.message).toBe('token expired');
  });
});
