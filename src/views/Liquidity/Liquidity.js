import React, { useMemo, useState } from 'react';
import Page from '../../components/Page';
import { createGlobalStyle } from 'styled-components';
import HomeImage from '../../assets/img/home.png';
import useLpStats from '../../hooks/useLpStats';
import { Box, Button, Grid, Paper, Typography } from '@material-ui/core';
import useNebulaStats from '../../hooks/useNebulaStats';
import TokenInput from '../../components/TokenInput';
import usePolarlysFinance from '../../hooks/usePolarlysFinance';
import { useWallet } from 'use-wallet';
import useTokenBalance from '../../hooks/useTokenBalance';
import { getDisplayBalance } from '../../utils/formatBalance';
import useApproveTaxOffice from '../../hooks/useApproveTaxOffice';
import { ApprovalState } from '../../hooks/useApprove';
import useProvideNebulaLP from '../../hooks/useProvideNebulaLP';
import { Alert } from '@material-ui/lab';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) no-repeat !important;
    background-size: cover !important;
  }
`;
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

const ProvideLiquidity = () => {
  const [nebulaAmount, setNebulaAmount] = useState(0);
  const [nearAmount, setNearAmount] = useState(0);
  const [lpTokensAmount, setLpTokensAmount] = useState(0);
  const { balance } = useWallet();
  const nebulaStats = useNebulaStats();
  const polarlysFinance = usePolarlysFinance();
  const [approveTaxOfficeStatus, approveTaxOffice] = useApproveTaxOffice();
  const nebulaBalance = useTokenBalance(polarlysFinance.NEBULA);
  const nearBalance = (balance / 1e18).toFixed(4);
  const { onProvideNebulaNearLP } = useProvideNebulaLP();
  const nebulaNearLpStats = useLpStats('NEBULA-NEAR-LP');

  const nebulaLPStats = useMemo(() => (nebulaNearLpStats ? nebulaNearLpStats : null), [nebulaNearLpStats]);
  const nebulaPriceInNEAR = useMemo(() => (nebulaStats ? Number(nebulaStats.tokenInNear).toFixed(2) : null), [nebulaStats]);
  const nearPriceInNEBULA = useMemo(() => (nebulaStats ? Number(1 / nebulaStats.tokenInNear).toFixed(2) : null), [nebulaStats]);
  // const classes = useStyles();

  const handleNebulaChange = async (e) => {
    if (e.currentTarget.value === '' || e.currentTarget.value === 0) {
      setNebulaAmount(e.currentTarget.value);
    }
    if (!isNumeric(e.currentTarget.value)) return;
    setNebulaAmount(e.currentTarget.value);
    const quoteFromSpooky = await polarlysFinance.quoteFromSpooky(e.currentTarget.value, 'NEBULA');
    setNearAmount(quoteFromSpooky);
    setLpTokensAmount(quoteFromSpooky / nebulaLPStats.nearAmount);
  };

  const handleNearChange = async (e) => {
    if (e.currentTarget.value === '' || e.currentTarget.value === 0) {
      setNearAmount(e.currentTarget.value);
    }
    if (!isNumeric(e.currentTarget.value)) return;
    setNearAmount(e.currentTarget.value);
    const quoteFromSpooky = await polarlysFinance.quoteFromSpooky(e.currentTarget.value, 'NEAR');
    setNebulaAmount(quoteFromSpooky);

    setLpTokensAmount(quoteFromSpooky / nebulaLPStats.tokenAmount);
  };
  const handleNebulaSelectMax = async () => {
    const quoteFromSpooky = await polarlysFinance.quoteFromSpooky(getDisplayBalance(nebulaBalance), 'NEBULA');
    setNebulaAmount(getDisplayBalance(nebulaBalance));
    setNearAmount(quoteFromSpooky);
    setLpTokensAmount(quoteFromSpooky / nebulaLPStats.nearAmount);
  };
  const handleNearSelectMax = async () => {
    const quoteFromSpooky = await polarlysFinance.quoteFromSpooky(nearBalance, 'NEAR');
    setNearAmount(nearBalance);
    setNebulaAmount(quoteFromSpooky);
    setLpTokensAmount(nearBalance / nebulaLPStats.nearAmount);
  };
  return (
    <Page>
      <BackgroundImage />
      <Typography color="textPrimary" align="center" variant="h3" gutterBottom>
        Provide Liquidity
      </Typography>

      <Grid container justify="center">
        <Box style={{ width: '600px' }}>
          <Alert variant="filled" severity="warning" style={{ marginBottom: '10px' }}>
            <b>This and <a href="https://spookyswap.finance/" rel="noopener noreferrer" target="_blank">Spookyswap</a> are the only ways to provide Liquidity on NEBULA-NEAR pair without paying tax.</b>
          </Alert>
          <Grid item xs={12} sm={12}>
            <Paper>
              <Box mt={4}>
                <Grid item xs={12} sm={12} style={{ borderRadius: 15 }}>
                  <Box p={4}>
                    <Grid container>
                      <Grid item xs={12}>
                        <TokenInput
                          onSelectMax={handleNebulaSelectMax}
                          onChange={handleNebulaChange}
                          value={nebulaAmount}
                          max={getDisplayBalance(nebulaBalance)}
                          symbol={'NEBULA'}
                        ></TokenInput>
                      </Grid>
                      <Grid item xs={12}>
                        <TokenInput
                          onSelectMax={handleNearSelectMax}
                          onChange={handleNearChange}
                          value={nearAmount}
                          max={nearBalance}
                          symbol={'NEAR'}
                        ></TokenInput>
                      </Grid>
                      <Grid item xs={12}>
                        <p>1 NEBULA = {nebulaPriceInNEAR} NEAR</p>
                        <p>1 NEAR = {nearPriceInNEBULA} NEBULA</p>
                        <p>LP tokens ≈ {lpTokensAmount.toFixed(2)}</p>
                      </Grid>
                      <Grid xs={12} justifyContent="center" style={{ textAlign: 'center' }}>
                        {approveTaxOfficeStatus === ApprovalState.APPROVED ? (
                          <Button
                            variant="contained"
                            onClick={() => onProvideNebulaNearLP(nearAmount.toString(), nebulaAmount.toString())}
                            color="primary"
                            style={{ margin: '0 10px', color: '#fff' }}
                          >
                            Supply
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => approveTaxOffice()}
                            color="secondary"
                            style={{ margin: '0 10px' }}
                          >
                            Approve
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Box>
      </Grid>
    </Page>
  );
};

export default ProvideLiquidity;
