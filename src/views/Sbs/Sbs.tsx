import React, { /*useCallback, useEffect, */useMemo, useState } from 'react';
import Page from '../../components/Page';
import PitImage from '../../assets/img/pit.png';
import { createGlobalStyle } from 'styled-components';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { useWallet } from 'use-wallet';
import UnlockWallet from '../../components/UnlockWallet';
import PageHeader from '../../components/PageHeader';
import { Box,/* Paper, Typography,*/ Button, Grid } from '@material-ui/core';
import styled from 'styled-components';
import Spacer from '../../components/Spacer';
import usePolarlysFinance from '../../hooks/usePolarlysFinance';
import { getDisplayBalance/*, getBalance*/ } from '../../utils/formatBalance';
import { BigNumber/*, ethers*/ } from 'ethers';
import useSwapStardustToBorealis from '../../hooks/BorealisSwapper/useSwapStarDustToBorealis';
import useApprove, { ApprovalState } from '../../hooks/useApprove';
import useBorealisSwapperStats from '../../hooks/BorealisSwapper/useBorealisSwapperStats';
import TokenInput from '../../components/TokenInput';
import Card from '../../components/Card';
import CardContent from '../../components/CardContent';
import TokenSymbol from '../../components/TokenSymbol';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${PitImage}) no-repeat !important;
    background-size: cover !important;
  }
`;

function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

const Sbs: React.FC = () => {
  const { path } = useRouteMatch();
  const { account } = useWallet();
  const polarlysFinance = usePolarlysFinance();
  const [stardustAmount, setStardustAmount] = useState('');
  const [borealisAmount, setBorealisAmount] = useState('');

  const [approveStatus, approve] = useApprove(polarlysFinance.STARDUST, polarlysFinance.contracts.BorealisSwapper.address);
  const { onSwapBorealis } = useSwapStardustToBorealis();
  const borealisSwapperStat = useBorealisSwapperStats(account);

  const borealisBalance = useMemo(() => (borealisSwapperStat ? Number(borealisSwapperStat.borealisBalance) : 0), [borealisSwapperStat]);
  const bondBalance = useMemo(() => (borealisSwapperStat ? Number(borealisSwapperStat.stardustBalance) : 0), [borealisSwapperStat]);

  const handleStarDustChange = async (e: any) => {
    if (e.currentTarget.value === '') {
      setStardustAmount('');
      setBorealisAmount('');
      return
    }
    if (!isNumeric(e.currentTarget.value)) return;
    setStardustAmount(e.currentTarget.value);
    const updateBorealisAmount = await polarlysFinance.estimateAmountOfBorealis(e.currentTarget.value);
    setBorealisAmount(updateBorealisAmount);
  };

  const handleStarDustSelectMax = async () => {
    setStardustAmount(String(bondBalance));
    const updateBorealisAmount = await polarlysFinance.estimateAmountOfBorealis(String(bondBalance));
    setBorealisAmount(updateBorealisAmount);
  };

  const handleBorealisSelectMax = async () => {
    setBorealisAmount(String(borealisBalance));
    const rateBorealisPerNebula = (await polarlysFinance.getBorealisSwapperStat(account)).rateBorealisPerNebula;
    const updateStarDustAmount = ((BigNumber.from(10).pow(30)).div(BigNumber.from(rateBorealisPerNebula))).mul(Number(borealisBalance) * 1e6);
    setStardustAmount(getDisplayBalance(updateStarDustAmount, 18, 6));
  };

  const handleBorealisChange = async (e: any) => {
    const inputData = e.currentTarget.value;
    if (inputData === '') {
      setBorealisAmount('');
      setStardustAmount('');
      return
    }
    if (!isNumeric(inputData)) return;
    setBorealisAmount(inputData);
    const rateBorealisPerNebula = (await polarlysFinance.getBorealisSwapperStat(account)).rateBorealisPerNebula;
    const updateStarDustAmount = ((BigNumber.from(10).pow(30)).div(BigNumber.from(rateBorealisPerNebula))).mul(Number(inputData) * 1e6);
    setStardustAmount(getDisplayBalance(updateStarDustAmount, 18, 6));
  }

  return (
    <Switch>
      <Page>
        <BackgroundImage />
        {!!account ? (
          <>
            <Route exact path={path}>
              <PageHeader icon={'🏦'} title="StarDust -> Borealis Swap" subtitle="Swap StarDust to Borealis" />
            </Route>
            <Box mt={5}>
              <Grid container justify="center" spacing={6}>
                <StyledBoardroom>
                  <StyledCardsWrapper>
                    <StyledCardWrapper>
                      <Card>
                        <CardContent>
                          <StyledCardContentInner>
                            <StyledCardTitle>StarDusts</StyledCardTitle>
                            <StyledExchanger>
                              <StyledToken>
                                <StyledCardIcon>
                                  <TokenSymbol symbol={polarlysFinance.STARDUST.symbol} size={54} />
                                </StyledCardIcon>
                              </StyledToken>
                            </StyledExchanger>
                            <Grid item xs={12}>
                              <TokenInput
                                onSelectMax={handleStarDustSelectMax}
                                onChange={handleStarDustChange}
                                value={stardustAmount}
                                max={bondBalance}
                                symbol="StarDust"
                              ></TokenInput>
                            </Grid>
                            <StyledDesc>{`${bondBalance} STARDUST Available in Wallet`}</StyledDesc>
                          </StyledCardContentInner>
                        </CardContent>
                      </Card>
                    </StyledCardWrapper>
                    <Spacer size="lg" />
                    <StyledCardWrapper>
                      <Card>
                        <CardContent>
                          <StyledCardContentInner>
                            <StyledCardTitle>Borealis</StyledCardTitle>
                            <StyledExchanger>
                              <StyledToken>
                                <StyledCardIcon>
                                  <TokenSymbol symbol={polarlysFinance.BOREALIS.symbol} size={54} />
                                </StyledCardIcon>
                              </StyledToken>
                            </StyledExchanger>
                            <Grid item xs={12}>
                              <TokenInput
                                onSelectMax={handleBorealisSelectMax}
                                onChange={handleBorealisChange}
                                value={borealisAmount}
                                max={borealisBalance}
                                symbol="Borealis"
                              ></TokenInput>
                            </Grid>
                            <StyledDesc>{`${borealisBalance} BOREALIS Available in Swapper`}</StyledDesc>
                          </StyledCardContentInner>
                        </CardContent>
                      </Card>

                    </StyledCardWrapper>
                  </StyledCardsWrapper>
                </StyledBoardroom>
              </Grid>
            </Box>

            <Box mt={5}>
              <Grid container justify="center">
                <Grid item xs={8}>
                  <Card>
                    <CardContent>
                      <StyledApproveWrapper>
                        {approveStatus !== ApprovalState.APPROVED ? (
                          <Button
                            disabled={approveStatus !== ApprovalState.NOT_APPROVED}
                            color="primary"
                            variant="contained"
                            onClick={approve}
                            size="medium"
                          >
                            Approve STARDUST
                          </Button>
                        ) : (
                          <Button
                            color="primary"
                            variant="contained"
                            onClick={() => onSwapBorealis(stardustAmount.toString())}
                            size="medium"
                          >
                            Swap
                          </Button>
                        )}
                      </StyledApproveWrapper>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          <UnlockWallet />
        )}
      </Page>
    </Switch>
  );
};

const StyledBoardroom = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledCardsWrapper = styled.div`
  display: flex;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`;

const StyledCardWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledApproveWrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
`;
const StyledCardTitle = styled.div`
  align-items: center;
  display: flex;
  font-size: 20px;
  font-weight: 700;
  height: 64px;
  justify-content: center;
  margin-top: ${(props) => -props.theme.spacing[3]}px;
`;

const StyledCardIcon = styled.div`
  background-color: ${(props) => props.theme.color.grey[900]};
  width: 72px;
  height: 72px;
  border-radius: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spacing[2]}px;
`;

const StyledExchanger = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: ${(props) => props.theme.spacing[5]}px;
`;

const StyledToken = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-weight: 600;
`;

const StyledCardContentInner = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`;

const StyledDesc = styled.span``;

export default Sbs;
