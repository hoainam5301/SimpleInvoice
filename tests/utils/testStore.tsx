import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '../../src/store/slices/authSlice';
import { invoiceApi } from '../../src/store/api/invoiceApi.rtk';

/**
 * Builds a fresh store mirroring `src/store/index.ts` so each test starts
 * from a clean slice/cache (the app's singleton store would leak state
 * across tests). Callers that mock the DI container get a store whose
 * thunks/queryFns route into their mocks.
 */
export function makeTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [invoiceApi.reducerPath]: invoiceApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: { ignoredPaths: [invoiceApi.reducerPath] },
      }).concat(invoiceApi.middleware),
  });
}

export type TestStore = ReturnType<typeof makeTestStore>;

/** Wrapper for renderHook/render that provides a store (a fresh one by default). */
export function makeWrapper(store: TestStore = makeTestStore()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
