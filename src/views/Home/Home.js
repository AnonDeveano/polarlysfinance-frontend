import React, { useMemo } from 'react';
import Page from '../../components/Page';
import HomeImage from '../../assets/img/home.png';
import CashImage from '../../assets/img/crypto_nebula_cash.svg';
import Image from 'material-ui-image';
import styled from 'styled-components';
import { Alert } from '@material-ui/lab';
import { createGlobalStyle } from 'styled-components';
import CountUp from 'react-countup';
import CardIcon from '../../components/CardIcon';
import TokenSymbol from '../../components/TokenSymbol';
import useNebulaStats from '../../hooks/useNebulaStats';
import useLpStats from '../../hooks/useLpStats';
import useModal from '../../hooks/useModal';
import useZap from '../../hooks/useZap';
import useBondStats from '../../hooks/useBondStats';
import useborealisStats from '../../hooks/useBorealisStats';
import useTotalValueLocked from '../../hooks/useTotalValueLocked';
import { nebula as nebulaTesting, borealis as borealisTesting } from '../../polarlys-finance/deployments/deployments.testing.json';
import { nebula as nebulaProd, borealis as borealisProd } from '../../polarlys-finance/deployments/deployments.mainnet.json';

import MetamaskFox from '../../assets/img/metamask-fox.svg';

import { Box, Button, Card, CardContent, Grid, Paper } from '@material-ui/core';
import ZapModal from '../Bank/components/ZapModal';

import { makeStyles } from '@material-ui/core/styles';
import usePolarlysFinance from '../../hooks/usePolarlysFinance';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) no-repeat !important;
    background-size: cover !important;
  }
`;

const useStyles = makeStyles((theme) => ({
  button: {
    [theme.breakpoints.down('415')]: {
      marginTop: '10px',
    },
  },
}));

const Home = () => {
  const classes = useStyles();
  const TVL = useTotalValueLocked();
  const nebulaNearLpStats = useLpStats('NEBULA-NEAR-LP');
  const borealisNearLpStats = useLpStats('BOREALIS-NEAR-LP');
  const nebulaStats = useNebulaStats();
  const borealisStats = useborealisStats();
  const starDustStats = useBondStats();
  const polarlysFinance = usePolarlysFinance();

  let nebula;
  let borealis;
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    nebula = nebulaTesting;
    borealis = borealisTesting;
  } else {
    nebula = nebulaProd;
    borealis = borealisProd;
  }

  const buyNebulaAddress = 'https://spookyswap.finance/swap?outputCurrency=' + nebula.address;
  const buyBorealisAddress = 'https://spookyswap.finance/swap?outputCurrency=' + borealis.address;

  const nebulaLPStats = useMemo(() => (nebulaNearLpStats ? nebulaNearLpStats : null), [nebulaNearLpStats]);
  const borealisLPStats = useMemo(() => (borealisNearLpStats ? borealisNearLpStats : null), [borealisNearLpStats]);
  const nebulaPriceInDollars = useMemo(
    () => (nebulaStats ? Number(nebulaStats.priceInDollars).toFixed(2) : null),
    [nebulaStats],
  );
  const nebulaPriceInNEAR = useMemo(() => (nebulaStats ? Number(nebulaStats.tokenInNear).toFixed(4) : null), [nebulaStats]);
  const nebulaCirculatingSupply = useMemo(() => (nebulaStats ? String(nebulaStats.circulatingSupply) : null), [nebulaStats]);
  const nebulaTotalSupply = useMemo(() => (nebulaStats ? String(nebulaStats.totalSupply) : null), [nebulaStats]);

  const borealisPriceInDollars = useMemo(
    () => (borealisStats ? Number(borealisStats.priceInDollars).toFixed(2) : null),
    [borealisStats],
  );
  const borealisPriceInNEAR = useMemo(
    () => (borealisStats ? Number(borealisStats.tokenInNear).toFixed(4) : null),
    [borealisStats],
  );
  const borealisCirculatingSupply = useMemo(
    () => (borealisStats ? String(borealisStats.circulatingSupply) : null),
    [borealisStats],
  );
  const borealisTotalSupply = useMemo(() => (borealisStats ? String(borealisStats.totalSupply) : null), [borealisStats]);

  const starDustPriceInDollars = useMemo(
    () => (starDustStats ? Number(starDustStats.priceInDollars).toFixed(2) : null),
    [starDustStats],
  );
  const starDustPriceInNEAR = useMemo(() => (starDustStats ? Number(starDustStats.tokenInNear).toFixed(4) : null), [starDustStats]);
  const starDustCirculatingSupply = useMemo(
    () => (starDustStats ? String(starDustStats.circulatingSupply) : null),
    [starDustStats],
  );
  const starDustTotalSupply = useMemo(() => (starDustStats ? String(starDustStats.totalSupply) : null), [starDustStats]);

  const nebulaLpZap = useZap({ depositTokenName: 'NEBULA-NEAR-LP' });
  const borealisLpZap = useZap({ depositTokenName: 'BOREALIS-NEAR-LP' });

  const StyledLink = styled.a`
    font-weight: 700;
    text-decoration: none;
  `;

  const [onPresentNebulaZap, onDissmissNebulaZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        nebulaLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissNebulaZap();
      }}
      tokenName={'NEBULA-NEAR-LP'}
    />,
  );

  const [onPresentBorealisZap, onDissmissBorealisZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        borealisLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissBorealisZap();
      }}
      tokenName={'BOREALIS-NEAR-LP'}
    />,
  );

  return (
    <Page>
      <BackgroundImage />
      <Grid container spacing={3}>
        {/* Logo */}
        <Grid container item xs={12} sm={4} justify="center">
          {/* <Paper>xs=6 sm=3</Paper> */}
          <Image color="none" style={{ width: '300px', paddingTop: '0px' }} src={CashImage} />
        </Grid>
        {/* Explanation text */}
        <Grid item xs={12} sm={8}>
          <Paper>
            <Box p={4}>
              <h2>Welcome to Nebula Finance</h2>
              <p>The first algorithmic stablecoin on Fantom Opera, pegged to the price of 1 NEAR via seigniorage.</p>
              <p>
                Stake your NEBULA-NEAR LP in the Cemetery to earn BOREALIS rewards.
                Then stake your earned BOREALIS in the WarpDrive to earn more NEBULA!
              </p>
            </Box>
          </Paper>



        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={12} justify="center" style={{ margin: '12px', display: 'flex' }}>
            <Alert variant="filled" severity="warning">
              <b>
                Please visit our <StyledLink target="_blank" href="https://docs.nebula.finance">documentation</StyledLink> before purchasing NEBULA or BOREALIS!</b>
            </Alert>
          </Grid>
        </Grid>

        {/* TVL */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <h2>Total Value Locked</h2>
              <CountUp style={{ fontSize: '25px' }} end={TVL} separator="," prefix="$" />
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet */}
        <Grid item xs={12} sm={8}>
          <Card style={{ height: '100%' }}>
            <CardContent align="center" style={{ marginTop: '2.5%' }}>
              {/* <h2 style={{ marginBottom: '20px' }}>Wallet Balance</h2> */}
              <Button color="primary" href="/warpdrive" variant="contained" style={{ marginRight: '10px' }}>
                Stake Now
              </Button>
              <Button href="/cemetery" variant="contained" style={{ marginRight: '10px' }}>
                Farm Now
              </Button>
              <Button
                color="primary"
                target="_blank"
                href={buyNebulaAddress}
                variant="contained"
                style={{ marginRight: '10px' }}
                className={classes.button}
              >
                Buy NEBULA
              </Button>
              <Button variant="contained" target="_blank" href={buyBorealisAddress} className={classes.button}>
                Buy BOREALIS
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* NEBULA */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>NEBULA</h2>
              <Button
                onClick={() => {
                  polarlysFinance.watchAssetInMetamask('NEBULA');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="NEBULA" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{nebulaPriceInNEAR ? nebulaPriceInNEAR : '-.----'} NEAR</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px', alignContent: 'flex-start' }}>
                  ${nebulaPriceInDollars ? nebulaPriceInDollars : '-.--'}
                </span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(nebulaCirculatingSupply * nebulaPriceInDollars).toFixed(2)} <br />
                Circulating Supply: {nebulaCirculatingSupply} <br />
                Total Supply: {nebulaTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* BOREALIS */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>BOREALIS</h2>
              <Button
                onClick={() => {
                  polarlysFinance.watchAssetInMetamask('BOREALIS');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="BOREALIS" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{borealisPriceInNEAR ? borealisPriceInNEAR : '-.----'} NEAR</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${borealisPriceInDollars ? borealisPriceInDollars : '-.--'}</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(borealisCirculatingSupply * borealisPriceInDollars).toFixed(2)} <br />
                Circulating Supply: {borealisCirculatingSupply} <br />
                Total Supply: {borealisTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* STARDUST */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>STARDUST</h2>
              <Button
                onClick={() => {
                  polarlysFinance.watchAssetInMetamask('STARDUST');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="STARDUST" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{starDustPriceInNEAR ? starDustPriceInNEAR : '-.----'} NEAR</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${starDustPriceInDollars ? starDustPriceInDollars : '-.--'}</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(starDustCirculatingSupply * starDustPriceInDollars).toFixed(2)} <br />
                Circulating Supply: {starDustCirculatingSupply} <br />
                Total Supply: {starDustTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <h2>NEBULA-NEAR Spooky LP</h2>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="NEBULA-NEAR-LP" />
                </CardIcon>
              </Box>
              <Box mt={2}>
                <Button color="primary" disabled={true} onClick={onPresentNebulaZap} variant="contained">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {nebulaLPStats?.tokenAmount ? nebulaLPStats?.tokenAmount : '-.--'} NEBULA /{' '}
                  {nebulaLPStats?.nearAmount ? nebulaLPStats?.nearAmount : '-.--'} NEAR
                </span>
              </Box>
              <Box>${nebulaLPStats?.priceOfOne ? nebulaLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: ${nebulaLPStats?.totalLiquidity ? nebulaLPStats.totalLiquidity : '-.--'} <br />
                Total supply: {nebulaLPStats?.totalSupply ? nebulaLPStats.totalSupply : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <h2>BOREALIS-NEAR Spooky LP</h2>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="BOREALIS-NEAR-LP" />
                </CardIcon>
              </Box>
              <Box mt={2}>
                <Button color="primary" onClick={onPresentBorealisZap} variant="contained">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {borealisLPStats?.tokenAmount ? borealisLPStats?.tokenAmount : '-.--'} BOREALIS /{' '}
                  {borealisLPStats?.nearAmount ? borealisLPStats?.nearAmount : '-.--'} NEAR
                </span>
              </Box>
              <Box>${borealisLPStats?.priceOfOne ? borealisLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: ${borealisLPStats?.totalLiquidity ? borealisLPStats.totalLiquidity : '-.--'}
                <br />
                Total supply: {borealisLPStats?.totalSupply ? borealisLPStats.totalSupply : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Page>
  );
};

export default Home;
