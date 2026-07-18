import authReducer, {
  login,
  logout,
  restoreSession,
  sessionExpired,
  clearAuthError,
} from '../../../src/store/slices/authSlice';
import { makeTestStore } from '../../utils/testStore';
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

const baseState = {
  user: null,
  isAuthenticated: false,
  isRestoring: true,
  isLoggingIn: false,
  error: null,
};

beforeEach(() => jest.clearAllMocks());

describe('authSlice reducer', () => {
  it('sessionExpired clears the user and de-authenticates', () => {
    const next = authReducer(
      { ...baseState, user, isAuthenticated: true },
      sessionExpired(),
    );
    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
  });

  it('clearAuthError wipes the error message', () => {
    const next = authReducer({ ...baseState, error: 'boom' }, clearAuthError());
    expect(next.error).toBeNull();
  });

  it('handles the login lifecycle (pending → fulfilled)', () => {
    const pending = authReducer(baseState, login.pending('', { username: 'j', password: 'p' }));
    expect(pending.isLoggingIn).toBe(true);
    expect(pending.error).toBeNull();

    const fulfilled = authReducer(pending, login.fulfilled(user, '', { username: 'j', password: 'p' }));
    expect(fulfilled.isLoggingIn).toBe(false);
    expect(fulfilled.user).toEqual(user);
    expect(fulfilled.isAuthenticated).toBe(true);
  });

  it('handles a rejected login by surfacing the rejectValue', () => {
    const action = login.rejected(new Error('x'), '', { username: 'j', password: 'p' }, 'Invalid login');
    const next = authReducer({ ...baseState, isLoggingIn: true }, action);
    expect(next.isLoggingIn).toBe(false);
    expect(next.error).toBe('Invalid login');
  });

  it('handles restoreSession fulfilled with a user and with null', () => {
    const withUser = authReducer(baseState, restoreSession.fulfilled(user, ''));
    expect(withUser.isRestoring).toBe(false);
    expect(withUser.isAuthenticated).toBe(true);

    const noUser = authReducer(baseState, restoreSession.fulfilled(null, ''));
    expect(noUser.isRestoring).toBe(false);
    expect(noUser.isAuthenticated).toBe(false);
  });

  it('handles restoreSession rejected by ending the restore and staying logged out', () => {
    const next = authReducer(baseState, restoreSession.rejected(new Error('x'), ''));
    expect(next.isRestoring).toBe(false);
    expect(next.isAuthenticated).toBe(false);
  });

  it('handles logout fulfilled by clearing the session', () => {
    const next = authReducer(
      { ...baseState, user, isAuthenticated: true },
      logout.fulfilled(undefined, ''),
    );
    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
  });
});

describe('authSlice thunks (dispatched through a real store)', () => {
  it('login success stores the returned user', async () => {
    mockedUseCases.login.execute.mockResolvedValue(session);
    const store = makeTestStore();

    await store.dispatch(login({ username: 'jane', password: 'pw' }));

    const state = store.getState().auth;
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('login failure maps an ApiError to its message', async () => {
    mockedUseCases.login.execute.mockRejectedValue(
      new ApiError({ type: ApiErrorType.UNAUTHORIZED, message: 'Invalid username or password.' }),
    );
    const store = makeTestStore();

    await store.dispatch(login({ username: 'jane', password: 'bad' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid username or password.');
  });

  it('restoreSession success authenticates the user', async () => {
    mockedUseCases.restoreSession.execute.mockResolvedValue(session);
    const store = makeTestStore();

    await store.dispatch(restoreSession());

    const state = store.getState().auth;
    expect(state.isRestoring).toBe(false);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears the session via the use case', async () => {
    mockedUseCases.logout.execute.mockResolvedValue(undefined);
    const store = makeTestStore();

    await store.dispatch(logout());

    expect(mockedUseCases.logout.execute).toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
