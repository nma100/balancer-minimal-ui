import BigNumber from 'bignumber.js';
import { formatUnits } from 'ethers/lib/utils';

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);

export const { 
    ROUND_UP, 
    ROUND_DOWN, 
    ROUND_HALF_UP, 
    ROUND_HALF_DOWN 
} = BigNumber;

export function bnum(val) {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnumf(value, precision = 2, rm = ROUND_HALF_UP) {
    let val;
    if (BigNumber.isBigNumber(value) && !value.isNaN() && value.isFinite()) {
        val = value;
    } else {
        val = ZERO;
    }
    return val.toFixed(precision, rm);
}

export function fromEthersBnum(value, decimals = 18) {
    const formatted = formatUnits(value, decimals);
    return bnum(formatted);
}
