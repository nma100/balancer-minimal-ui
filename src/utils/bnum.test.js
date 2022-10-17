import { expect,  assert } from 'chai';
import { bnum, bnumToStr, ZERO } from "./bnum";

it('bnum', () => {
    expect(bnum(null).isEqualTo(ZERO)).to.be.true;
    expect(bnum(undefined).isEqualTo(ZERO)).to.be.true;
    assert.isTrue(bnum('0xf').isEqualTo(bnum(15)));
});

it('bnumToStr', () => {
    assert.strictEqual(bnumToStr(null), '0.00');
    assert.strictEqual(bnumToStr(ZERO, 4), '0.0000');
});

// npm run test .\src\utils\bnum.test.js 
