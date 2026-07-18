import { act, renderHook } from '@testing-library/react-native';
import { usePagination } from '../../../src/presentation/hooks/usePagination';

describe('usePagination — infinite-scroll bookkeeping', () => {
  it('starts at page 1 and allows loading more before totals are known', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 20 }));
    expect(result.current.page).toBe(1);
    expect(result.current.canLoadMore).toBe(true);
  });

  it('advances pages until totalPages is reached, then clamps', () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.setTotalPages(3));
    act(() => result.current.nextPage());
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(3);
    expect(result.current.canLoadMore).toBe(false);

    // A further nextPage (e.g. a late onEndReached) must NOT overshoot —
    // this is what prevents useless requests past the last page.
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(3);
  });

  it('reset returns to page 1 and forgets the previous total', () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setTotalPages(2));
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(2);

    act(() => result.current.reset());
    expect(result.current.page).toBe(1);
    expect(result.current.canLoadMore).toBe(true);
  });
});
