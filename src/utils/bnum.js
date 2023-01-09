
import BigNumber from 'bignumber.js';
import { formatUnits } from 'ethers/lib/utils';

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);

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
    return val.toFixed(precision);
}

export function fromEthersBnum(value, decimals) {
    const formatted = formatUnits(value, decimals);
    return bnum(formatted);
}
