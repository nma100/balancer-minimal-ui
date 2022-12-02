
import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);

export function bnum(val) {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnumf(value, precision = 2) {
    let val;
    if (BigNumber.isBigNumber(value) && !value.isNaN() && value.isFinite()) {
        val = value;
    } else {
        val = ZERO;
    }
    return val.toFixed(precision)
}
