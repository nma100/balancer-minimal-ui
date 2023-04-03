import { BalancerSDK, Relayer, SimulationType } from '@balancer-labs/sdk';
import { assert } from 'chai';
import { constants, Wallet } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { bn, bnc } from '../../utils/bn';

const INFURA = '';
const TRADER_KEY = '';
const TIMEOUT = 1000000000;

let sdk, signer;

beforeAll(() => {
    sdk = new BalancerSDK({
        network: 5,
        rpcUrl: `https://goerli.infura.io/v3/${INFURA}`,
    });
    signer = new Wallet(TRADER_KEY, sdk.provider);
});

it('Direct join', async () => {

    // Pool Goerli bal/weth 
    const poolId = '0xf8a0623ab66f985effc1c69d05f1af4badb01b00000200000000000000000060';
    const weth = '0xdfcea9088c8a88a76ff74892c1457c17dfeef9c1';
    const bal = '0xfa8449189744799ad2ace7e0ebac8bb7575eff47';

    const tokensIn = [ weth, bal ];
    const amountsIn = ['1000000000000000', '200000000000000000']; // 0.001 eth, 0.2 bal
    const slippage = '100';

    await vaultTokensApproval(tokensIn, sdk, signer);

    const pool = await sdk.pools.find(poolId);

    const { to, data, minBPTOut } = pool.buildJoin(
        signer.address,
        tokensIn,
        amountsIn,
        slippage
    );

    const pi = await pool.calcPriceImpact(amountsIn, minBPTOut, true);
    const piBN = bn(formatUnits(pi)).times(100);
    console.log('Price impact', `${bnc(piBN, 5)}%`);

    try {

        const tokenBalancesBefore = (
            await getBalances([pool.address, ...pool.tokensList], sdk, signer)
          ).map(b => formatUnits(b));
        console.log('Balance before : ', tokenBalancesBefore);

        const tx = await signer.sendTransaction({ to, data });
        await tx.wait();

        const tokenBalancesAfter = (
            await getBalances([pool.address, ...pool.tokensList], sdk, signer)
          ).map(b => formatUnits(b));
        console.log('Balance after : ', tokenBalancesAfter);

    } catch(e) {
        console.error(e);
        assert.fail();
    }

}, TIMEOUT);

it('Generalised join', async () => {

    const bbausd = {
        id: '0x3d5981bdd8d3e49eb7bbdc1d2b156a3ee019c18e0000000000000000000001a7',
        address: '0x3d5981BDD8D3E49EB7BBDC1d2B156a3eE019c18e',
        decimals: 18,
        symbol: 'bbausd2',
        slot: 0,
    };
    const dai  = '0xb8096bc53c3ce4c11ebb0069da0341d75264b104';
    const usdt = '0x14468fd5e1de5a5a4882fa5f4e2217c5a8ddcadb';

    const tokensIn = [ dai, usdt ];
    const amountsIn = ['100000000000000000', '200000']; // 0.1 dai, 0.2 usdt
    const slippage = '100';
    const wrapLeafTokens = false;

    await vaultTokensApproval(tokensIn, sdk, signer);
    
    const relayerAuth = await Relayer.signRelayerApproval(
        sdk.contracts.relayerV4.address,
        signer.address,
        signer,
        sdk.contracts.vault
    );

    const { to, encodedCall: data } = await sdk.pools.generalisedJoin(
        bbausd.id,
        tokensIn,
        amountsIn,
        signer.address,
        wrapLeafTokens,
        slippage,
        signer,
        SimulationType.VaultModel,
        relayerAuth
    );

    const tokenBalancesBefore = (
        await getBalances([bbausd.address, ...tokensIn], sdk, signer)
      ).map(b => formatUnits(b));
    console.log('Balance before : ', tokenBalancesBefore);

    const tx = await signer.sendTransaction({ to, data });
    await tx.wait();

    const tokenBalancesAfter = (
        await getBalances([bbausd.address, ...tokensIn], sdk, signer)
        ).map(b => formatUnits(b));
    console.log('Balance after : ', tokenBalancesAfter);

}, TIMEOUT);

export const getBalances = async (tokens, sdk, signer) => {
    const balances = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === constants.AddressZero) {
        balances[i] = signer.getBalance();
      } else {
        balances[i] = sdk.balancerContracts
            .getErc20(tokens[i], signer)
            .balanceOf(signer.address);
      }
    }
    return Promise.all(balances);
};

export const vaultTokensApproval = async (tokens, sdk, signer) => {
    for (const token of tokens) {
        const tx = await sdk.balancerContracts
            .getErc20(token, signer)
            .approve(sdk.contracts.vault.address, constants.MaxUint256);
        await tx.wait();  
    }
}

// npm run test .\src\protocol\services\join-pool-service.test.js -- -t 'Direct join'
// npm run test .\src\protocol\services\join-pool-service.test.js -- -t 'Generalised join'
