import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { invoiceApi } from './api/invoiceApi.rtk';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // AuthSession/User objects are plain data, but Date/Error-carrying
      // rejected actions are common enough that we keep serializable-check
      // defaults on everywhere EXCEPT the RTK Query slice, whose internal
      // cache entries are intentionally non-serializable.
      serializableCheck: {
        ignoredPaths: [invoiceApi.reducerPath],
      },
    }).concat(invoiceApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
