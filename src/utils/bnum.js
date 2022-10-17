
import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);

export function bnum(val) {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnumToStr(val, precision = 2) {
    const _val = BigNumber.isBigNumber(val) ? val : ZERO;
    return _val.toFixed(precision)
}
