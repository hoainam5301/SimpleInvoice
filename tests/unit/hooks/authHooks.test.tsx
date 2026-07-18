import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLogin } from '../../../src/presentation/hooks/useLogin';
import { useAuth } from '../../../src/presentation/hooks/useAuth';
import { makeTestStore, makeWrapper } from '../../utils/testStore';
import { container } from '../../../src/app/di/container';
import { ApiError, ApiErrorType } from '../../../src/core/network/apiError';
import type { User } from '../../../src/domain/entities/User';
import type { AuthSession } from '../../../src/domain/entities/Auth';

jest.mock('../../../src/app/di/container', () => ({
  container: {
    useCases: {
      login: { execute: jest.fn() },
      logout: { execute: jest.fn() },
      restoreSession: { execute: jest.fn() },
      getInvoices: { execute: jest.fn() },
      createInvoice: { execute: jest.fn() },
    },
  },
}));

const mockedUseCases = container.useCases as unknown as {
  login: { execute: jest.Mock };
  logout: { execute: jest.Mock };
  restoreSession: { execute: jest.Mock };
};

const user: User = { id: 'u1', fullName: 'Jane Doe', memberships: [] };
const session: AuthSession = { user, accessToken: 'a', orgToken: 'o' };

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCases.restoreSession.execute.mockResolvedValue(null);
});

describe('useLogin', () => {
  it('submit dispatches login and reflects success in store state', async () => {
    mockedUseCases.login.execute.mockResolvedValue(session);
    const store = makeTestStore();
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.submit({ username: 'jane', password: 'pw' });
    });

    expect(mockedUseCases.login.execute).toHaveBeenCalledWith({ username: 'jane', password: 'pw' });
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('exposes the error message on a failed login and clearError wipes it', async () => {
    mockedUseCases.login.execute.mockRejectedValue(
      new ApiError({ type: ApiErrorType.UNAUTHORIZED, message: 'Bad credentials' }),
    );
    const store = makeTestStore();
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.submit({ username: 'jane', password: 'bad' });
    });
    await waitFor(() => expect(result.current.error).toBe('Bad credentials'));

    act(() => result.current.clearError());
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

describe('useAuth', () => {
  it('triggers restoreSession only once across multiple mounts', async () => {
    // NOTE: this must be the first test to mount useAuth in this file — the
    // once-per-process guard is module-level state.
    const wrapper = makeWrapper();

    const first = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockedUseCases.restoreSession.execute).toHaveBeenCalledTimes(1));

    first.unmount();
    renderHook(() => useAuth(), { wrapper });

    // Still one — the second mount does not re-dispatch restore.
    expect(mockedUseCases.restoreSession.execute).toHaveBeenCalledTimes(1);
  });

  it('logout dispatches the logout use case and de-authenticates', async () => {
    mockedUseCases.logout.execute.mockResolvedValue(undefined);
    const store = makeTestStore();
    // Seed an authenticated session.
    mockedUseCases.login.execute.mockResolvedValue(session);
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedUseCases.logout.execute).toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('reflects the store session state', async () => {
    const store = makeTestStore();
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper(store) });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
