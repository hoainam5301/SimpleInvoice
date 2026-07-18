import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../../src/presentation/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 400));
    expect(result.current).toBe('initial');
  });

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 400), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(399);
    });

    expect(result.current).toBe('first');
  });

  it('updates to the latest value once the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 400), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe('second');
  });

  it('resets the timer on rapid successive changes, keeping only the last value', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 400), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // 400ms hasn't elapsed since 'c' was set (only 200ms has)
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('c');
  });
});
