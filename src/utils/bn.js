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
    return validate(value).toFixed(dp, rm);
}

export function bnc(value, dp = PRECISION, rm = ROUND_HALF_UP) {

    let val = validate(value);

    if (val.abs().gte('1e+9')) {
        return `${bnf(val.div('1e+9'), dp, rm)}B`;
    } else if (val.abs().gte('1e+6')) {
        return `${bnf(val.div('1e+6'), dp, rm)}M`;
    } else if (val.abs().gte('1e+3')) {
        return `${bnf(val.div('1e+3'), dp, rm)}K`;
    } else {
        return bnf(val, dp, rm);
    }
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

function validate(value) {
    let val;
    if (BigNumber.isBigNumber(value) && !value.isNaN() && value.isFinite()) {
        val = value;
    } else {
        val = ZERO;
    }
    return val;
}
