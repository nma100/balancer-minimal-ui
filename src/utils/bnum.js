
import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);

export function bnum(val)  {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnumToStr(val, precision = 2)  {
    if (BigNumber.isBigNumber(val)) {
        return val.toFixed(precision)
    } else { 
        return bnumToStr(ZERO, precision);
    }
}
