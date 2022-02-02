// import { Fetcher, Route, Token } from '@uniswap/sdk';
import { Fetcher as FetcherSpirit, Token as TokenSpirit } from '@spiritswap/sdk';
import { Fetcher, Route, Token } from '@spookyswap/sdk';
import { Configuration } from './config';
import { ContractName, TokenStat, AllocationTime, LPStat, Bank, PoolStats, BorealisSwapperStat } from './types';
import { BigNumber, Contract, ethers, EventFilter } from 'ethers';
import { decimalToBalance } from './ether-utils';
import { TransactionResponse } from '@ethersproject/providers';
import ERC20 from './ERC20';
import { getFullDisplayBalance, getDisplayBalance } from '../utils/formatBalance';
import { getDefaultProvider } from '../utils/provider';
import IUniswapV2PairABI from './IUniswapV2Pair.abi.json';
import config, { bankDefinitions } from '../config';
import moment from 'moment';
import { parseUnits } from 'ethers/lib/utils';
import { NEAR_TICKER, SPOOKY_ROUTER_ADDR, NEBULA_TICKER } from '../utils/constants';
/**
 * An API module of Nebula Finance contracts.
 * All contract-interacting domain logic should be defined in here.
 */
export class PolarlysFinance {
  myAccount: string;
  provider: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  config: Configuration;
  contracts: { [name: string]: Contract };
  externalTokens: { [name: string]: ERC20 };
  warpdriveVersionOfUser?: string;

  NEBULAWNEAR_LP: Contract;
  NEBULA: ERC20;
  BOREALIS: ERC20;
  STARDUST: ERC20;
  NEAR: ERC20;

  constructor(cfg: Configuration) {
    const { deployments, externalTokens } = cfg;
    const provider = getDefaultProvider();

    // loads contracts from deployments
    this.contracts = {};
    for (const [name, deployment] of Object.entries(deployments)) {
      this.contracts[name] = new Contract(deployment.address, deployment.abi, provider);
    }
    this.externalTokens = {};
    for (const [symbol, [address, decimal]] of Object.entries(externalTokens)) {
      this.externalTokens[symbol] = new ERC20(address, provider, symbol, decimal);
    }
    this.NEBULA = new ERC20(deployments.nebula.address, provider, 'NEBULA');
    this.BOREALIS = new ERC20(deployments.borealis.address, provider, 'BOREALIS');
    this.STARDUST = new ERC20(deployments.starDust.address, provider, 'STARDUST');
    this.NEAR = this.externalTokens['WNEAR'];

    // Uniswap V2 Pair
    this.NEBULAWNEAR_LP = new Contract(externalTokens['NEBULA-NEAR-LP'][0], IUniswapV2PairABI, provider);

    this.config = cfg;
    this.provider = provider;
  }

  /**
   * @param provider From an unlocked wallet. (e.g. Metamask)
   * @param account An address of unlocked wallet account.
   */
  unlockWallet(provider: any, account: string) {
    const newProvider = new ethers.providers.Web3Provider(provider, this.config.chainId);
    this.signer = newProvider.getSigner(0);
    this.myAccount = account;
    for (const [name, contract] of Object.entries(this.contracts)) {
      this.contracts[name] = contract.connect(this.signer);
    }
    const tokens = [this.NEBULA, this.BOREALIS, this.STARDUST, ...Object.values(this.externalTokens)];
    for (const token of tokens) {
      token.connect(this.signer);
    }
    this.NEBULAWNEAR_LP = this.NEBULAWNEAR_LP.connect(this.signer);
    console.log(`🔓 Wallet is unlocked. Welcome, ${account}!`);
    this.fetchWarpDriveVersionOfUser()
      .then((version) => (this.warpdriveVersionOfUser = version))
      .catch((err) => {
        console.error(`Failed to fetch warpdrive version: ${err.stack}`);
        this.warpdriveVersionOfUser = 'latest';
      });
  }

  get isUnlocked(): boolean {
    return !!this.myAccount;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //===================FROM SPOOKY TO DISPLAY =========================
  //=========================IN HOME PAGE==============================
  //===================================================================

  async getNebulaStat(): Promise<TokenStat> {
    const { NebulaNearRewardPool, NebulaNearLpNebulaRewardPool, NebulaNearLpNebulaRewardPoolOld } = this.contracts;
    const supply = await this.NEBULA.totalSupply();
    const nebulaRewardPoolSupply = await this.NEBULA.balanceOf(NebulaNearRewardPool.address);
    const nebulaRewardPoolSupply2 = await this.NEBULA.balanceOf(NebulaNearLpNebulaRewardPool.address);
    const nebulaRewardPoolSupplyOld = await this.NEBULA.balanceOf(NebulaNearLpNebulaRewardPoolOld.address);
    const nebulaCirculatingSupply = supply
      .sub(nebulaRewardPoolSupply)
      .sub(nebulaRewardPoolSupply2)
      .sub(nebulaRewardPoolSupplyOld);
    const priceInNEAR = await this.getTokenPriceFromPancakeswap(this.NEBULA);
    const priceOfOneNEAR = await this.getWNEARPriceFromPancakeswap();
    const priceOfNebulaInDollars = (Number(priceInNEAR) * Number(priceOfOneNEAR)).toFixed(2);

    return {
      tokenInNear: priceInNEAR,
      priceInDollars: priceOfNebulaInDollars,
      totalSupply: getDisplayBalance(supply, this.NEBULA.decimal, 0),
      circulatingSupply: getDisplayBalance(nebulaCirculatingSupply, this.NEBULA.decimal, 0),
    };
  }

  /**
   * Calculates various stats for the requested LP
   * @param name of the LP token to load stats for
   * @returns
   */
  async getLPStat(name: string): Promise<LPStat> {
    const lpToken = this.externalTokens[name];
    const lpTokenSupplyBN = await lpToken.totalSupply();
    const lpTokenSupply = getDisplayBalance(lpTokenSupplyBN, 18);
    const token0 = name.startsWith('NEBULA') ? this.NEBULA : this.BOREALIS;
    const isNebula = name.startsWith('NEBULA');
    const tokenAmountBN = await token0.balanceOf(lpToken.address);
    const tokenAmount = getDisplayBalance(tokenAmountBN, 18);

    const nearAmountBN = await this.NEAR.balanceOf(lpToken.address);
    const nearAmount = getDisplayBalance(nearAmountBN, 18);
    const tokenAmountInOneLP = Number(tokenAmount) / Number(lpTokenSupply);
    const nearAmountInOneLP = Number(nearAmount) / Number(lpTokenSupply);
    const lpTokenPrice = await this.getLPTokenPrice(lpToken, token0, isNebula);
    const lpTokenPriceFixed = Number(lpTokenPrice).toFixed(2).toString();
    const liquidity = (Number(lpTokenSupply) * Number(lpTokenPrice)).toFixed(2).toString();
    return {
      tokenAmount: tokenAmountInOneLP.toFixed(2).toString(),
      nearAmount: nearAmountInOneLP.toFixed(2).toString(),
      priceOfOne: lpTokenPriceFixed,
      totalLiquidity: liquidity,
      totalSupply: Number(lpTokenSupply).toFixed(2).toString(),
    };
  }

  /**
   * Use this method to get price for Nebula
   * @returns TokenStat for STARDUST
   * priceInNEAR
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async gestarDustStat(): Promise<TokenStat> {
    const { Treasury } = this.contracts;
    const nebulaStat = await this.getNebulaStat();
    const bondNebulaRatioBN = await Treasury.gestarDustPremiumRate();
    const modifier = bondNebulaRatioBN / 1e18 > 1 ? bondNebulaRatioBN / 1e18 : 1;
    const bondPriceInNEAR = (Number(nebulaStat.tokenInNear) * modifier).toFixed(2);
    const priceOfStarDustInDollars = (Number(nebulaStat.priceInDollars) * modifier).toFixed(2);
    const supply = await this.STARDUST.displayedTotalSupply();
    return {
      tokenInNear: bondPriceInNEAR,
      priceInDollars: priceOfStarDustInDollars,
      totalSupply: supply,
      circulatingSupply: supply,
    };
  }

  /**
   * @returns TokenStat for BOREALIS
   * priceInNEAR
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async geborealisStat(): Promise<TokenStat> {
    const { NebulaNearLPBorealisRewardPool } = this.contracts;

    const supply = await this.BOREALIS.totalSupply();

    const priceInNEAR = await this.getTokenPriceFromPancakeswap(this.BOREALIS);
    const nebulaRewardPoolSupply = await this.BOREALIS.balanceOf(NebulaNearLPBorealisRewardPool.address);
    const borealisCirculatingSupply = supply.sub(nebulaRewardPoolSupply);
    const priceOfOneNEAR = await this.getWNEARPriceFromPancakeswap();
    const priceOfSharesInDollars = (Number(priceInNEAR) * Number(priceOfOneNEAR)).toFixed(2);

    return {
      tokenInNear: priceInNEAR,
      priceInDollars: priceOfSharesInDollars,
      totalSupply: getDisplayBalance(supply, this.BOREALIS.decimal, 0),
      circulatingSupply: getDisplayBalance(borealisCirculatingSupply, this.BOREALIS.decimal, 0),
    };
  }

  async getNebulaStatInEstimatedTWAP(): Promise<TokenStat> {
    const { SeigniorageOracle, NebulaNearRewardPool } = this.contracts;
    const expectedPrice = await SeigniorageOracle.twap(this.NEBULA.address, ethers.utils.parseEther('1'));

    const supply = await this.NEBULA.totalSupply();
    const nebulaRewardPoolSupply = await this.NEBULA.balanceOf(NebulaNearRewardPool.address);
    const nebulaCirculatingSupply = supply.sub(nebulaRewardPoolSupply);
    return {
      tokenInNear: getDisplayBalance(expectedPrice),
      priceInDollars: getDisplayBalance(expectedPrice),
      totalSupply: getDisplayBalance(supply, this.NEBULA.decimal, 0),
      circulatingSupply: getDisplayBalance(nebulaCirculatingSupply, this.NEBULA.decimal, 0),
    };
  }

  async getNebulaPriceInLastTWAP(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getNebulaUpdatedPrice();
  }

  async gestarDustsPurchasable(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getBurnableNebulaLeft();
  }

  /**
   * Calculates the TVL, APR and daily APR of a provided pool/bank
   * @param bank
   * @returns
   */
  async getPoolAPRs(bank: Bank): Promise<PoolStats> {
    if (this.myAccount === undefined) return;
    const depositToken = bank.depositToken;
    const poolContract = this.contracts[bank.contract];
    const depositTokenPrice = await this.getDepositTokenPriceInDollars(bank.depositTokenName, depositToken);
    const stakeInPool = await depositToken.balanceOf(bank.address);
    const TVL = Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const stat = bank.earnTokenName === 'NEBULA' ? await this.getNebulaStat() : await this.geborealisStat();
    const tokenPerSecond = await this.getTokenPerSecond(
      bank.earnTokenName,
      bank.contract,
      poolContract,
      bank.depositTokenName,
    );

    const tokenPerHour = tokenPerSecond.mul(60).mul(60);
    const totalRewardPricePerYear =
      Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24).mul(365)));
    const totalRewardPricePerDay = Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24)));
    const totalStakingTokenInPool =
      Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const dailyAPR = (totalRewardPricePerDay / totalStakingTokenInPool) * 100;
    const yearlyAPR = (totalRewardPricePerYear / totalStakingTokenInPool) * 100;
    return {
      dailyAPR: dailyAPR.toFixed(2).toString(),
      yearlyAPR: yearlyAPR.toFixed(2).toString(),
      TVL: TVL.toFixed(2).toString(),
    };
  }

  /**
   * Method to return the amount of tokens the pool yields per second
   * @param earnTokenName the name of the token that the pool is earning
   * @param contractName the contract of the pool/bank
   * @param poolContract the actual contract of the pool
   * @returns
   */
  async getTokenPerSecond(
    earnTokenName: string,
    contractName: string,
    poolContract: Contract,
    depositTokenName: string,
  ) {
    if (earnTokenName === 'NEBULA') {
      if (!contractName.endsWith('NebulaRewardPool')) {
        const rewardPerSecond = await poolContract.nebulaPerSecond();
        if (depositTokenName === 'WNEAR') {
          return rewardPerSecond.mul(6000).div(11000).div(24);
        } else if (depositTokenName === 'BOO') {
          return rewardPerSecond.mul(2500).div(11000).div(24);
        } else if (depositTokenName === 'ZOO') {
          return rewardPerSecond.mul(1000).div(11000).div(24);
        } else if (depositTokenName === 'SHIBA') {
          return rewardPerSecond.mul(1500).div(11000).div(24);
        }
        return rewardPerSecond.div(24);
      }
      const poolStartTime = await poolContract.poolStartTime();
      const startDateTime = new Date(poolStartTime.toNumber() * 1000);
      const FOUR_DAYS = 4 * 24 * 60 * 60 * 1000;
      if (Date.now() - startDateTime.getTime() > FOUR_DAYS) {
        return await poolContract.epochNebulaPerSecond(1);
      }
      return await poolContract.epochNebulaPerSecond(0);
    }
    const rewardPerSecond = await poolContract.borealisPerSecond();
    if (depositTokenName.startsWith('NEBULA')) {
      return rewardPerSecond.mul(35500).div(59500);
    } else {
      return rewardPerSecond.mul(24000).div(59500);
    }
  }

  /**
   * Method to calculate the tokenPrice of the deposited asset in a pool/bank
   * If the deposited token is an LP it will find the price of its pieces
   * @param tokenName
   * @param pool
   * @param token
   * @returns
   */
  async getDepositTokenPriceInDollars(tokenName: string, token: ERC20) {
    let tokenPrice;
    const priceOfOneNearInDollars = await this.getWNEARPriceFromPancakeswap();
    if (tokenName === 'WNEAR') {
      tokenPrice = priceOfOneNearInDollars;
    } else {
      if (tokenName === 'NEBULA-NEAR-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.NEBULA, true);
      } else if (tokenName === 'BOREALIS-NEAR-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.BOREALIS, false);
      } else if (tokenName === 'SHIBA') {
        tokenPrice = await this.getTokenPriceFromSpiritswap(token);
      } else {
        tokenPrice = await this.getTokenPriceFromPancakeswap(token);
        tokenPrice = (Number(tokenPrice) * Number(priceOfOneNearInDollars)).toString();
      }
    }
    return tokenPrice;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //=========================== END ===================================
  //===================================================================

  async getCurrentEpoch(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.epoch();
  }

  async gestarDustOraclePriceInLastTWAP(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.gestarDustPremiumRate();
  }

  /**
   * Buy bonds with cash.
   * @param amount amount of cash to purchase bonds with.
   */
  async buyBonds(amount: string | number): Promise<TransactionResponse> {
    const { Treasury } = this.contracts;
    const treasuryNebulaPrice = await Treasury.getNebulaPrice();
    return await Treasury.buyBonds(decimalToBalance(amount), treasuryNebulaPrice);
  }

  /**
   * Redeem bonds for cash.
   * @param amount amount of bonds to redeem.
   */
  async redeemBonds(amount: string): Promise<TransactionResponse> {
    const { Treasury } = this.contracts;
    const priceForNebula = await Treasury.getNebulaPrice();
    return await Treasury.redeemBonds(decimalToBalance(amount), priceForNebula);
  }

  async getTotalValueLocked(): Promise<Number> {
    let totalValue = 0;
    for (const bankInfo of Object.values(bankDefinitions)) {
      const pool = this.contracts[bankInfo.contract];
      const token = this.externalTokens[bankInfo.depositTokenName];
      const tokenPrice = await this.getDepositTokenPriceInDollars(bankInfo.depositTokenName, token);
      const tokenAmountInPool = await token.balanceOf(pool.address);
      const value = Number(getDisplayBalance(tokenAmountInPool, token.decimal)) * Number(tokenPrice);
      const poolValue = Number.isNaN(value) ? 0 : value;
      totalValue += poolValue;
    }

    const BOREALISPrice = (await this.geborealisStat()).priceInDollars;
    const warpdriveborealisBalanceOf = await this.BOREALIS.balanceOf(this.currentWarpDrive().address);
    const warpdriveTVL = Number(getDisplayBalance(warpdriveborealisBalanceOf, this.BOREALIS.decimal)) * Number(BOREALISPrice);

    return totalValue + warpdriveTVL;
  }

  /**
   * Calculates the price of an LP token
   * Reference https://github.com/DefiDebauchery/discordpricebot/blob/4da3cdb57016df108ad2d0bb0c91cd8dd5f9d834/pricebot/pricebot.py#L150
   * @param lpToken the token under calculation
   * @param token the token pair used as reference (the other one would be NEAR in most cases)
   * @param isNebula sanity check for usage of nebula token or borealis
   * @returns price of the LP token
   */
  async getLPTokenPrice(lpToken: ERC20, token: ERC20, isNebula: boolean): Promise<string> {
    const totalSupply = getFullDisplayBalance(await lpToken.totalSupply(), lpToken.decimal);
    //Get amount of tokenA
    const tokenSupply = getFullDisplayBalance(await token.balanceOf(lpToken.address), token.decimal);
    const stat = isNebula === true ? await this.getNebulaStat() : await this.geborealisStat();
    const priceOfToken = stat.priceInDollars;
    const tokenInLP = Number(tokenSupply) / Number(totalSupply);
    const tokenPrice = (Number(priceOfToken) * tokenInLP * 2) //We multiply by 2 since half the price of the lp token is the price of each piece of the pair. So twice gives the total
      .toString();
    return tokenPrice;
  }

  async earnedFromBank(
    poolName: ContractName,
    earnTokenName: String,
    poolId: Number,
    account = this.myAccount,
  ): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      if (earnTokenName === 'NEBULA') {
        return await pool.pendingNEBULA(poolId, account);
      } else {
        return await pool.pendingShare(poolId, account);
      }
    } catch (err) {
      console.error(`Failed to call earned() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  async stakedBalanceOnBank(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      let userInfo = await pool.userInfo(poolId, account);
      return await userInfo.amount;
    } catch (err) {
      console.error(`Failed to call balanceOf() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  /**
   * Deposits token to given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async stake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.deposit(poolId, amount);
  }

  /**
   * Withdraws token from given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async unstake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.withdraw(poolId, amount);
  }

  /**
   * Transfers earned token reward from given pool to my account.
   */
  async harvest(poolName: ContractName, poolId: Number): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    //By passing 0 as the amount, we are asking the contract to only redeem the reward and not the currently staked token
    return await pool.withdraw(poolId, 0);
  }

  /**
   * Harvests and withdraws deposited tokens from the pool.
   */
  async exit(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    let userInfo = await pool.userInfo(poolId, account);
    return await pool.withdraw(poolId, userInfo.amount);
  }

  async fetchWarpDriveVersionOfUser(): Promise<string> {
    return 'latest';
  }

  currentWarpDrive(): Contract {
    if (!this.warpdriveVersionOfUser) {
      //throw new Error('you must unlock the wallet to continue.');
    }
    return this.contracts.WarpDrive;
  }

  isOldWarpDriveMember(): boolean {
    return this.warpdriveVersionOfUser !== 'latest';
  }

  async getTokenPriceFromPancakeswap(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;
    const { WNEAR } = this.config.externalTokens;

    const wnear = new Token(chainId, WNEAR[0], WNEAR[1]);
    const token = new Token(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wnearToToken = await Fetcher.fetchPairData(wnear, token, this.provider);
      const priceInBUSD = new Route([wnearToToken], token);

      return priceInBUSD.midPrice.toFixed(4);
    } catch (err) {
      console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  async getTokenPriceFromSpiritswap(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;

    const { WNEAR } = this.externalTokens;

    const wnear = new TokenSpirit(chainId, WNEAR.address, WNEAR.decimal);
    const token = new TokenSpirit(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wnearToToken = await FetcherSpirit.fetchPairData(wnear, token, this.provider);
      const liquidityToken = wnearToToken.liquidityToken;
      let nearBalanceInLP = await WNEAR.balanceOf(liquidityToken.address);
      let nearAmount = Number(getFullDisplayBalance(nearBalanceInLP, WNEAR.decimal));
      let shibaBalanceInLP = await tokenContract.balanceOf(liquidityToken.address);
      let shibaAmount = Number(getFullDisplayBalance(shibaBalanceInLP, tokenContract.decimal));
      const priceOfOneNearInDollars = await this.getWNEARPriceFromPancakeswap();
      let priceOfShiba = (nearAmount / shibaAmount) * Number(priceOfOneNearInDollars);
      return priceOfShiba.toString();
    } catch (err) {
      console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  async getWNEARPriceFromPancakeswap(): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { WNEAR, FUSDT } = this.externalTokens;
    try {
      const fusdt_wnear_lp_pair = this.externalTokens['USDT-NEAR-LP'];
      let near_amount_BN = await WNEAR.balanceOf(fusdt_wnear_lp_pair.address);
      let near_amount = Number(getFullDisplayBalance(near_amount_BN, WNEAR.decimal));
      let fusdt_amount_BN = await FUSDT.balanceOf(fusdt_wnear_lp_pair.address);
      let fusdt_amount = Number(getFullDisplayBalance(fusdt_amount_BN, FUSDT.decimal));
      return (fusdt_amount / near_amount).toString();
    } catch (err) {
      console.error(`Failed to fetch token price of WNEAR: ${err}`);
    }
  }

  //===================================================================
  //===================================================================
  //===================== MASONRY METHODS =============================
  //===================================================================
  //===================================================================

  async getWarpDriveAPR() {
    const WarpDrive = this.currentWarpDrive();
    const latestSnapshotIndex = await WarpDrive.latestSnapshotIndex();
    const lastHistory = await WarpDrive.warpdriveHistory(latestSnapshotIndex);

    const lastRewardsReceived = lastHistory[1];

    const BOREALISPrice = (await this.geborealisStat()).priceInDollars;
    const NEBULAPrice = (await this.getNebulaStat()).priceInDollars;
    const epochRewardsPerShare = lastRewardsReceived / 1e18;

    //Mgod formula
    const amountOfRewardsPerDay = epochRewardsPerShare * Number(NEBULAPrice) * 4;
    const warpdriveborealisBalanceOf = await this.BOREALIS.balanceOf(WarpDrive.address);
    const warpdriveTVL = Number(getDisplayBalance(warpdriveborealisBalanceOf, this.BOREALIS.decimal)) * Number(BOREALISPrice);
    const realAPR = ((amountOfRewardsPerDay * 100) / warpdriveTVL) * 365;
    return realAPR;
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the WarpDrive
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserClaimRewardFromWarpDrive(): Promise<boolean> {
    const WarpDrive = this.currentWarpDrive();
    return await WarpDrive.canClaimReward(this.myAccount);
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the WarpDrive
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserUnstakeFromWarpDrive(): Promise<boolean> {
    const WarpDrive = this.currentWarpDrive();
    const canWithdraw = await WarpDrive.canWithdraw(this.myAccount);
    const stakedAmount = await this.getStakedSharesOnWarpDrive();
    const notStaked = Number(getDisplayBalance(stakedAmount, this.BOREALIS.decimal)) === 0;
    const result = notStaked ? true : canWithdraw;
    return result;
  }

  async timeUntilClaimRewardFromWarpDrive(): Promise<BigNumber> {
    // const WarpDrive = this.currentWarpDrive();
    // const warper = await WarpDrive.warpers(this.myAccount);
    return BigNumber.from(0);
  }

  async getTotalStakedInWarpDrive(): Promise<BigNumber> {
    const WarpDrive = this.currentWarpDrive();
    return await WarpDrive.totalSupply();
  }

  async stakeShareToWarpDrive(amount: string): Promise<TransactionResponse> {
    if (this.isOldWarpDriveMember()) {
      throw new Error("you're using old warpdrive. please withdraw and deposit the BOREALIS again.");
    }
    const WarpDrive = this.currentWarpDrive();
    return await WarpDrive.stake(decimalToBalance(amount));
  }

  async getStakedSharesOnWarpDrive(): Promise<BigNumber> {
    const WarpDrive = this.currentWarpDrive();
    if (this.warpdriveVersionOfUser === 'v1') {
      return await WarpDrive.geborealisOf(this.myAccount);
    }
    return await WarpDrive.balanceOf(this.myAccount);
  }

  async getEarningsOnWarpDrive(): Promise<BigNumber> {
    const WarpDrive = this.currentWarpDrive();
    if (this.warpdriveVersionOfUser === 'v1') {
      return await WarpDrive.getCashEarningsOf(this.myAccount);
    }
    return await WarpDrive.earned(this.myAccount);
  }

  async withdrawBorealisFromWarpDrive(amount: string): Promise<TransactionResponse> {
    const WarpDrive = this.currentWarpDrive();
    return await WarpDrive.withdraw(decimalToBalance(amount));
  }

  async harvestCashFromWarpDrive(): Promise<TransactionResponse> {
    const WarpDrive = this.currentWarpDrive();
    if (this.warpdriveVersionOfUser === 'v1') {
      return await WarpDrive.claimDividends();
    }
    return await WarpDrive.claimReward();
  }

  async exitFromWarpDrive(): Promise<TransactionResponse> {
    const WarpDrive = this.currentWarpDrive();
    return await WarpDrive.exit();
  }

  async getTreasuryNextAllocationTime(): Promise<AllocationTime> {
    const { Treasury } = this.contracts;
    const nextEpochTimestamp: BigNumber = await Treasury.nextEpochPoint();
    const nextAllocation = new Date(nextEpochTimestamp.mul(1000).toNumber());
    const prevAllocation = new Date(Date.now());

    return { from: prevAllocation, to: nextAllocation };
  }
  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to claim
   * their reward from the warpdrive
   * @returns Promise<AllocationTime>
   */
  async getUserClaimRewardTime(): Promise<AllocationTime> {
    const { WarpDrive, Treasury } = this.contracts;
    const nextEpochTimestamp = await WarpDrive.nextEpochPoint(); //in unix timestamp
    const currentEpoch = await WarpDrive.epoch();
    const warper = await WarpDrive.warpers(this.myAccount);
    const startTimeEpoch = warper.epochTimerStart;
    const period = await Treasury.PERIOD();
    const periodInHours = period / 60 / 60; // 6 hours, period is displayed in seconds which is 21600
    const rewardLockupEpochs = await WarpDrive.rewardLockupEpochs();
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(rewardLockupEpochs);

    const fromDate = new Date(Date.now());
    if (targetEpochForClaimUnlock - currentEpoch <= 0) {
      return { from: fromDate, to: fromDate };
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return { from: fromDate, to: toDate };
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - currentEpoch - 1;
      const endDate = moment(toDate)
        .add(delta * periodInHours, 'hours')
        .toDate();
      return { from: fromDate, to: endDate };
    }
  }

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to unstake
   * from the warpdrive
   * @returns Promise<AllocationTime>
   */
  async getUserUnstakeTime(): Promise<AllocationTime> {
    const { WarpDrive, Treasury } = this.contracts;
    const nextEpochTimestamp = await WarpDrive.nextEpochPoint();
    const currentEpoch = await WarpDrive.epoch();
    const warper = await WarpDrive.warpers(this.myAccount);
    const startTimeEpoch = warper.epochTimerStart;
    const period = await Treasury.PERIOD();
    const PeriodInHours = period / 60 / 60;
    const withdrawLockupEpochs = await WarpDrive.withdrawLockupEpochs();
    const fromDate = new Date(Date.now());
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(withdrawLockupEpochs);
    const stakedAmount = await this.getStakedSharesOnWarpDrive();
    if (currentEpoch <= targetEpochForClaimUnlock && Number(stakedAmount) === 0) {
      return { from: fromDate, to: fromDate };
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return { from: fromDate, to: toDate };
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - Number(currentEpoch) - 1;
      const endDate = moment(toDate)
        .add(delta * PeriodInHours, 'hours')
        .toDate();
      return { from: fromDate, to: endDate };
    }
  }

  async watchAssetInMetamask(assetName: string): Promise<boolean> {
    const { ethereum } = window as any;
    if (ethereum && ethereum.networkVersion === config.chainId.toString()) {
      let asset;
      let assetUrl;
      if (assetName === 'NEBULA') {
        asset = this.NEBULA;
        assetUrl = 'https://nebula.finance/presskit/nebula_icon_noBG.png';
      } else if (assetName === 'BOREALIS') {
        asset = this.BOREALIS;
        assetUrl = 'https://nebula.finance/presskit/borealis_icon_noBG.png';
      } else if (assetName === 'STARDUST') {
        asset = this.STARDUST;
        assetUrl = 'https://nebula.finance/presskit/stardust_icon_noBG.png';
      }
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: asset.address,
            symbol: asset.symbol,
            decimals: 18,
            image: assetUrl,
          },
        },
      });
    }
    return true;
  }

  async provideNebulaNearLP(nearAmount: string, nebulaAmount: BigNumber): Promise<TransactionResponse> {
    const { TaxOffice } = this.contracts;
    let overrides = {
      value: parseUnits(nearAmount, 18),
    };
    return await TaxOffice.addLiquidityETHTaxFree(nebulaAmount, nebulaAmount.mul(992).div(1000), parseUnits(nearAmount, 18).mul(992).div(1000), overrides);
  }

  async quoteFromSpooky(tokenAmount: string, tokenName: string): Promise<string> {
    const { SpookyRouter } = this.contracts;
    const { _reserve0, _reserve1 } = await this.NEBULAWNEAR_LP.getReserves();
    let quote;
    if (tokenName === 'NEBULA') {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve1, _reserve0);
    } else {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve0, _reserve1);
    }
    return (quote / 1e18).toString();
  }

  /**
   * @returns an array of the regulation events till the most up to date epoch
   */
  async listenForRegulationsEvents(): Promise<any> {
    const { Treasury } = this.contracts;

    const treasuryDaoFundedFilter = Treasury.filters.DaoFundFunded();
    const treasuryDevFundedFilter = Treasury.filters.DevFundFunded();
    const treasuryWarpDriveFundedFilter = Treasury.filters.WarpDriveFunded();
    const boughstarDustsFilter = Treasury.filters.BoughstarDusts();
    const redeemBondsFilter = Treasury.filters.RedeemedBonds();

    let epochBlocksRanges: any[] = [];
    let warpdriveFundEvents = await Treasury.queryFilter(treasuryWarpDriveFundedFilter);
    var events: any[] = [];
    warpdriveFundEvents.forEach(function callback(value, index) {
      events.push({ epoch: index + 1 });
      events[index].warpdriveFund = getDisplayBalance(value.args[1]);
      if (index === 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
      }
      if (index > 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
        epochBlocksRanges[index - 1].endBlock = value.blockNumber;
      }
    });

    epochBlocksRanges.forEach(async (value, index) => {
      events[index].bondsBought = await this.gestarDustsWithFilterForPeriod(
        boughstarDustsFilter,
        value.startBlock,
        value.endBlock,
      );
      events[index].bondsRedeemed = await this.gestarDustsWithFilterForPeriod(
        redeemBondsFilter,
        value.startBlock,
        value.endBlock,
      );
    });
    let DEVFundEvents = await Treasury.queryFilter(treasuryDevFundedFilter);
    DEVFundEvents.forEach(function callback(value, index) {
      events[index].devFund = getDisplayBalance(value.args[1]);
    });
    let DAOFundEvents = await Treasury.queryFilter(treasuryDaoFundedFilter);
    DAOFundEvents.forEach(function callback(value, index) {
      events[index].daoFund = getDisplayBalance(value.args[1]);
    });
    return events;
  }

  /**
   * Helper method
   * @param filter applied on the query to the treasury events
   * @param from block number
   * @param to block number
   * @returns the amount of bonds events emitted based on the filter provided during a specific period
   */
  async gestarDustsWithFilterForPeriod(filter: EventFilter, from: number, to: number): Promise<number> {
    const { Treasury } = this.contracts;
    const bondsAmount = await Treasury.queryFilter(filter, from, to);
    return bondsAmount.length;
  }

  async estimateZapIn(tokenName: string, lpName: string, amount: string): Promise<number[]> {
    const { zapper } = this.contracts;
    const lpToken = this.externalTokens[lpName];
    let estimate;
    if (tokenName === NEAR_TICKER) {
      estimate = await zapper.estimateZapIn(lpToken.address, SPOOKY_ROUTER_ADDR, parseUnits(amount, 18));
    } else {
      const token = tokenName === NEBULA_TICKER ? this.NEBULA : this.BOREALIS;
      estimate = await zapper.estimateZapInToken(
        token.address,
        lpToken.address,
        SPOOKY_ROUTER_ADDR,
        parseUnits(amount, 18),
      );
    }
    return [estimate[0] / 1e18, estimate[1] / 1e18];
  }
  async zapIn(tokenName: string, lpName: string, amount: string): Promise<TransactionResponse> {
    const { zapper } = this.contracts;
    const lpToken = this.externalTokens[lpName];
    if (tokenName === NEAR_TICKER) {
      let overrides = {
        value: parseUnits(amount, 18),
      };
      return await zapper.zapIn(lpToken.address, SPOOKY_ROUTER_ADDR, this.myAccount, overrides);
    } else {
      const token = tokenName === NEBULA_TICKER ? this.NEBULA : this.BOREALIS;
      return await zapper.zapInToken(
        token.address,
        parseUnits(amount, 18),
        lpToken.address,
        SPOOKY_ROUTER_ADDR,
        this.myAccount,
      );
    }
  }
  async swapStardustToBorealis(stardustAmount: BigNumber): Promise<TransactionResponse> {
    const { BorealisSwapper } = this.contracts;
    return await BorealisSwapper.swapStardustToBorealis(stardustAmount);
  }
  async estimateAmountOfBorealis(stardustAmount: string): Promise<string> {
    const { BorealisSwapper } = this.contracts;
    try {
      const estimateBN = await BorealisSwapper.estimateAmountOfBorealis(parseUnits(stardustAmount, 18));
      return getDisplayBalance(estimateBN, 18, 6);
    } catch (err) {
      console.error(`Failed to fetch estimate borealis amount: ${err}`);
    }
  }

  async getBorealisSwapperStat(address: string): Promise<BorealisSwapperStat> {
    const { BorealisSwapper } = this.contracts;
    const borealisBalanceBN = await BorealisSwapper.getBorealisBalance();
    const stardustBalanceBN = await BorealisSwapper.getStarDustBalance(address);
    // const nebulaPriceBN = await BorealisSwapper.getNebulaPrice();
    // const borealisPriceBN = await BorealisSwapper.getBorealisPrice();
    const rateBorealisPerNebulaBN = await BorealisSwapper.getBorealisAmountPerNebula();
    const borealisBalance = getDisplayBalance(borealisBalanceBN, 18, 5);
    const stardustBalance = getDisplayBalance(stardustBalanceBN, 18, 5);
    return {
      borealisBalance: borealisBalance.toString(),
      stardustBalance: stardustBalance.toString(),
      // nebulaPrice: nebulaPriceBN.toString(),
      // borealisPrice: borealisPriceBN.toString(),
      rateBorealisPerNebula: rateBorealisPerNebulaBN.toString(),
    };
  }
}
