import { constants } from "ethers";
import { BalancerSDK } from "@balancer-labs/sdk";
import { nativeAsset } from "../networks";
import { getRpcUrl } from "../utils/rpc";
import { bn, fromEthersBN } from "../utils/bn";
import { AprService } from "./services/apr-service";
import { SwapService, Given } from "./services/swap-service";
import { LiquidityService } from "./services/liquidity-service";
import { TokenListService } from "./services/token-list-service";
import { TokenPriceService } from "./services/token-price-service";
import { StakingService } from "./services/staking-service";
import { RewardService } from "./services/reward-service";
import { PortfolioLoader } from "./portfolio-loader";
import { PoolService } from "./services/pool-service";
import { VolumeService } from "./services/volume-service";
import { JoinPoolService } from "./services/join-pool-service";
import { ExitPoolService } from "./services/exit-pool-service";
import { PriceImpactService } from "./services/price-impact-service";

export class BalancerHelper {
  
  constructor(chainId) {
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId),
    });
    this.aprService = new AprService(this.sdk.pools);
    this.volumeService = new VolumeService(this.sdk.pools);
    this.liquidityService = new LiquidityService(this.sdk.pools);
    this.swapService = new SwapService(this.sdk.swaps);
    this.tokenPriceService = new TokenPriceService(this.sdk.data);
    this.tokenListService = new TokenListService(chainId);
    this.stakingService = new StakingService(this.sdk);
    this.rewardService = new RewardService(this.sdk); 
    this.poolService = new PoolService(this.sdk);
    this.joinService = new JoinPoolService(this.sdk);
    this.exitService = new ExitPoolService(this.sdk);
    this.priceImpactService = new PriceImpactService(this.sdk);
  }

  async loadApr(pool) {
    return await this.aprService.apr(pool);
  }

  async loadVolume(pool) {
    return await this.volumeService.volume(pool);
  }

  async loadLiquidity(pool) {
    return await this.liquidityService.liquidity(pool);
  }

  async findRoute(kind, tokens, amount) {
    return await this.swapService.findRoute(kind, tokens, amount);
  }

  async swap(swapInfo, web3Provider) {
    return await this.swapService.swap(swapInfo, web3Provider);
  }

  async joinPool(joinInfo, web3Provider) {
    return await this.joinService.join(joinInfo, web3Provider);
  }
  
  async exitPool(exitInfo, web3Provider) {
    return await this.exitService.exit(exitInfo, web3Provider);
  }

  async buildExitPoolTx(exitInfo, web3Provider) {
    return await this.exitService.buildTx(exitInfo, web3Provider);
  }

  async priceImpact(info, web3Provider, isJoin) {
    return await this.priceImpactService.pi(info, web3Provider, isJoin);
  }

  async userBalance(user, token) {
    const { provider } = this.sdk;

    let balance;
    if (token.address === constants.AddressZero) {
      balance = await provider.getBalance(user);
    } else {
      balance = await this.ERC20(token.address, provider).balanceOf(user);
    }

    return fromEthersBN(balance, token.decimals);
  }

  async allowance(owner, spender, token) {
    const { provider } = this.sdk;

    const allowance = await this
      .ERC20(token.address, provider)
      .allowance(owner, spender);

    return fromEthersBN(allowance, token.decimals);
  }

  async totalSupply(token) {
    const { provider } = this.sdk;

    const totalSupply = await this
      .ERC20(token.address, provider)
      .totalSupply();

    return fromEthersBN(totalSupply, token.decimals);
  }

  priceInfo(route, kind, tokens) {
    const { tokenIn, tokenOut } = tokens;
    let amountIn, amountOut;
    if (kind === Given.In) {
      amountIn  = fromEthersBN(route.swapAmount, tokenIn.decimals);
      amountOut = fromEthersBN(route.returnAmount, tokenOut.decimals);
    } else {
      amountIn  = fromEthersBN(route.returnAmount, tokenIn.decimals);
      amountOut = fromEthersBN(route.swapAmount, tokenOut.decimals);
    }
    const spotPrice = bn(route.marketSp);
    const effectivePrice = amountIn.div(amountOut);
    const priceImpact = effectivePrice.minus(spotPrice).div(spotPrice).times(100);
    return { 
      spotPrice, effectivePrice, priceImpact, 
      amounts: { amountIn, amountOut }, 
    };
  }

  async findPreferentialGauge(poolAddress) {
    const result = await this.sdk.data.poolGauges.find(poolAddress);
    if (!result) {
      return undefined;
    } else if (result.gauges.length === 1) {
      return result.gauges[0].id;
    } else {
      return result.preferentialGauge.id;
    }
  }

  async userBoosts(account) {
    return await this.rewardService.userBoosts(account);
  }

  async fetchPools(first = 10, skip = 0) {
    return await this.poolService.fetchPools(first, skip);
  }

  async findPool(poolId) {
    return await this.poolService.findPool(poolId);
  }

  async findPoolsByToken(token) {
    return await this.poolService.findPoolsByToken(token);
  }

  async fetchTokens(excludeNativeCoin = false) {
    const nativeCoin = nativeAsset(this.chainId);
    const approved = this.tokenListService.approvedTokens();
    let tokens = TokenListService.reduce(await approved, this.chainId);
    if (!excludeNativeCoin) tokens.unshift(nativeCoin);
    return tokens;
  }

  async findToken(symbol) {
    const tokens = await this.fetchTokens();
    return tokens.find(t => t.symbol === symbol);
  }

  async fetchPrice(token, amount) {
    return await this.tokenPriceService.fetch(token, amount);
  }

  async getSpotPrice(tokenIn, tokenOut) {
    return await this.sdk.pricing.getSpotPrice(tokenIn, tokenOut);
  }

  loadPortfolio(account, bag) {
    const portfolio = new PortfolioLoader(account, bag, this.sdk);
    return portfolio.load();
  }

  ERC20(erc20address, signerOrProvider) {
    const { balancerContracts } = this.sdk;
    return balancerContracts.getErc20(erc20address, signerOrProvider);
  }

  liquidityGauge(gaugeAddress, signerOrProvider) {
    const { balancerContracts } = this.sdk;
    return balancerContracts.getLiquidityGauge(gaugeAddress, signerOrProvider);
  }

  networkConfig() {
    return this.sdk.networkConfig;
  }

  veBalPoolId() {
    return this.stakingService.veBalPoolId();
  }

  stakablePoolIds() {
    return this.stakingService.stakablePoolIds();
  }
}
