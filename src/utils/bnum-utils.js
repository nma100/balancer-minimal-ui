import BigNumber from 'bignumber.js';

export function bnum(val) {
    const number = typeof val === 'string' ? val : val ? val.toString() : '0';
    return new BigNumber(number);
  }

export const ZERO = bnum(0);
