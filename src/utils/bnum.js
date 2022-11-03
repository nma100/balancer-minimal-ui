
import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);

export function bnum(val) {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnumf(val, precision = 2) {
    let _val;
    if (BigNumber.isBigNumber(val) && !val.isNaN() && val.isFinite()) {
        _val = val;
    } else {
        _val = ZERO;
    }
    return _val.toFixed(precision)
}
