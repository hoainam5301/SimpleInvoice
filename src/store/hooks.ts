import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed Redux hooks — every component uses these instead of the raw
 * `useDispatch`/`useSelector`, so `state` is inferred as `RootState`
 * everywhere without a manual generic at each call site.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
