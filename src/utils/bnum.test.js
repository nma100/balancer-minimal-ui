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

// npm run test .\src\utils\bnum.test.js 
