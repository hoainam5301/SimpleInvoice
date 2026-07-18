import { isNonEmptyString, isPositiveNumber } from '../../../src/core/utils/validators';

describe('isNonEmptyString', () => {
  it.each([
    ['hello', true],
    ['  hello  ', true],
    ['', false],
    ['   ', false],
    [undefined, false],
    [123, false],
  ])('isNonEmptyString(%p) -> %p', (input, expected) => {
    expect(isNonEmptyString(input)).toBe(expected);
  });
});

describe('isPositiveNumber', () => {
  it.each([
    [1, true],
    [0.01, true],
    [0, false],
    [-5, false],
    [NaN, false],
    ['5', false],
  ])('isPositiveNumber(%p) -> %p', (input, expected) => {
    expect(isPositiveNumber(input)).toBe(expected);
  });
});
