import BigNumber from 'bignumber.js';
import { expect,  assert } from 'chai';
import { bn, bnf, bnt, ZERO } from "./bn";

it('bn', () => {
    expect(bn(null).isEqualTo(ZERO)).to.be.true;
    expect(bn(undefined).isEqualTo(ZERO)).to.be.true;
    assert.isTrue(bn('0xf').isEqualTo(bn(15)));
});

it('bnf', () => {
    assert.strictEqual(bnf(null), '0.00');
    assert.strictEqual(bnf(ZERO, 4), '0.0000');
});

it('toString', () => {
    BigNumber.set({ DECIMAL_PLACES: 2, ROUNDING_MODE: 4 })
    let z = BigNumber('1000000.123456');
    console.log(z.toString());                    
});

it('toFixed', () => {
    console.log(bn(0.0000004).toFixed(3, BigNumber.ROUND_HALF_UP));                    
    console.log(bn(0.0000004).toFixed(3, BigNumber.ROUND_UP));                    
});

it('toPrecision', () => {
    let n = bn(0.000000000012);
    console.log(n.toPrecision(20));

    n = bn(100000);
    console.log(n.toPrecision(10));
});

it('dp', () => {
    console.log(bn(1).div(3).dp(3).toFixed(5));                    
});

it('bnt', () => {
    let n = bn(12.345);
    assert.strictEqual(bnf(n, 5), '12.34500');
    assert.strictEqual(bnt(n, 5), '12.345');
});

it('cfg',() => {
    BigNumber.set({ DECIMAL_PLACES: 10 });

    const BN = BigNumber.clone({ DECIMAL_PLACES: 3 });

    const x = new BigNumber(1);
    const y = new BN(1);

    console.log(x.div(3).toString());    
    console.log(y.div(3).toString());    
});

// npm run test .\src\utils\bn.test.js 
// npm run test .\src\utils\bn.test.js -- -t 'cfg'