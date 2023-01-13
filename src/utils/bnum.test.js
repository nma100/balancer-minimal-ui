import BigNumber from 'bignumber.js';
import { expect,  assert } from 'chai';
import { bnum, bnumf, ZERO } from "./bnum";

it('bnum', () => {
    expect(bnum(null).isEqualTo(ZERO)).to.be.true;
    expect(bnum(undefined).isEqualTo(ZERO)).to.be.true;
    assert.isTrue(bnum('0xf').isEqualTo(bnum(15)));
});

it('bnumf', () => {
    assert.strictEqual(bnumf(null), '0.00');
    assert.strictEqual(bnumf(ZERO, 4), '0.0000');
});

it('toString', () => {
    BigNumber.set({ DECIMAL_PLACES: 2, ROUNDING_MODE: 4 })
    let z = BigNumber('1000000.123456');
    console.log(z.toString());                    
});

it('toFixed', () => {
    console.log(bnum(0.0000004).toFixed(3, BigNumber.ROUND_HALF_UP));                    
    console.log(bnum(0.0000004).toFixed(3, BigNumber.ROUND_UP));                    
});

it('toPrecision', () => {
    let bn = bnum(0.000000000012);
    console.log(bn.toPrecision(20));

    bn = bnum(100000);
    console.log(bn.toPrecision(10));
});

// npm run test .\src\utils\bnum.test.js 
