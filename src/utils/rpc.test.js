import { assert } from 'chai';
import { getRpcUrl } from './rpc';
import { ARBITRUM_ID, ETHEREUM_ID, GOERLI_ID, POLYGON_ID } from '../networks';

it('rpc url', () => {
    assert.exists(getRpcUrl(ETHEREUM_ID));
    assert.exists(getRpcUrl(POLYGON_ID));
    assert.exists(getRpcUrl(ARBITRUM_ID));
    assert.exists(getRpcUrl(GOERLI_ID));
    try {
        getRpcUrl('abc');
        assert.fail();
    } catch (error) {}
});