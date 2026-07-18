import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { container } from '../../app/di/container';
import type { User } from '../../domain/entities/User';
import type { LoginCredentials } from '../../domain/entities/Auth';
import { ApiError } from '../../core/network/apiError';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True only during the one-time cold-start session restore. */
  isRestoring: boolean;
  isLoggingIn: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isRestoring: true,
  isLoggingIn: false,
  error: null,
};

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export const login = createAsyncThunk<User, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const session = await container.useCases.login.execute(credentials);
      return session.user;
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const restoreSession = createAsyncThunk<User | null>('auth/restoreSession', async () => {
  const session = await container.useCases.restoreSession.execute();
  return session?.user ?? null;
});

export const logout = createAsyncThunk<void>('auth/logout', async () => {
  await container.useCases.logout.execute();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Invoked by the sessionEvents bridge (see AppProviders) on a 401 from any API call. */
    sessionExpired(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoggingIn = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoggingIn = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.error = action.payload ?? 'Login failed.';
      })
      .addCase(restoreSession.pending, state => {
        state.isRestoring = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(restoreSession.rejected, state => {
        state.isRestoring = false;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
