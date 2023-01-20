import BigNumber from 'bignumber.js';
import { formatUnits } from 'ethers/lib/utils';

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);

const PRECISION = 2;

export const { 
    ROUND_UP, 
    ROUND_DOWN, 
    ROUND_HALF_UP, 
    ROUND_HALF_DOWN 
} = BigNumber;

export function bn(val) {
    if (!val) return ZERO;
    return new BigNumber(val);
}

export function bnf(value, dp = PRECISION, rm = ROUND_HALF_UP) {
    let val;
    if (BigNumber.isBigNumber(value) && !value.isNaN() && value.isFinite()) {
        val = value;
    } else {
        val = ZERO;
    }
    return val.toFixed(dp, rm);
}

export function bnt(value, dp = PRECISION, rm = ROUND_HALF_UP) {
    let val = bnf(value, dp, rm);
    if (val.includes('.')) {
        val = val.replace(/0+$/, '');
        val = val.replace(/\.$/, '');
    }
    return val;
}

export function fromEthersBN(value, decimals = 18) {
    const formatted = formatUnits(value, decimals);
    return bn(formatted);
}
