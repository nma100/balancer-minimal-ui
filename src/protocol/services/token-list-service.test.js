import { assert } from 'chai';
import { ETHEREUM_ID, GOERLI_ID, POLYGON_ID } from '../../networks';
import { TokenListService } from './token-list-service';

it('All tokens', async () => {
    const service = new TokenListService(ETHEREUM_ID);
    const allTokens = await service.allTokens();
    assert.isNotNull(allTokens);
});

it('Default', async () => {
    const service = new TokenListService(GOERLI_ID);
    console.log('Default', await service.defaultTokens());
});

it('Vetted', async () => {
    const service = new TokenListService(GOERLI_ID);
    console.log('Vetted', await service.vettedTokens());
});

it('Approved', async () => {
    const service = new TokenListService(POLYGON_ID);
    (await service.approvedTokens()).forEach(tokenList => {
        console.log('Name', tokenList.name)
        console.log('Keywords', tokenList.keywords)
        console.log('Number of tokens', tokenList.tokens.length)
    });
});

it('Urls', async () => {
    const service = new TokenListService(ETHEREUM_ID);
    console.log('Urls', service.urls());
});

// npm run test .\src\protocol\services\token-list-service.test.js
// npm run test .\src\protocol\services\token-list-service.test.js -- -t 'Urls'