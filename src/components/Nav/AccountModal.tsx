import React, { useMemo } from 'react';
import styled from 'styled-components';
import useTokenBalance from '../../hooks/useTokenBalance';
import { getDisplayBalance } from '../../utils/formatBalance';

import Label from '../Label';
import Modal, { ModalProps } from '../Modal';
import ModalTitle from '../ModalTitle';
import usePolarlysFinance from '../../hooks/usePolarlysFinance';
import TokenSymbol from '../TokenSymbol';

const AccountModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const polarlysFinance = usePolarlysFinance();

  const nebulaBalance = useTokenBalance(polarlysFinance.NEBULA);
  const displayNebulaBalance = useMemo(() => getDisplayBalance(nebulaBalance), [nebulaBalance]);

  const borealisBalance = useTokenBalance(polarlysFinance.BOREALIS);
  const displayBorealisBalance = useMemo(() => getDisplayBalance(borealisBalance), [borealisBalance]);

  const stardustBalance = useTokenBalance(polarlysFinance.STARDUST);
  const displayStardustBalance = useMemo(() => getDisplayBalance(stardustBalance), [stardustBalance]);

  return (
    <Modal>
      <ModalTitle text="My Wallet" />

      <Balances>
        <StyledBalanceWrapper>
          <TokenSymbol symbol="NEBULA" />
          <StyledBalance>
            <StyledValue>{displayNebulaBalance}</StyledValue>
            <Label text="NEBULA Available" />
          </StyledBalance>
        </StyledBalanceWrapper>

        <StyledBalanceWrapper>
          <TokenSymbol symbol="BOREALIS" />
          <StyledBalance>
            <StyledValue>{displayBorealisBalance}</StyledValue>
            <Label text="BOREALIS Available" />
          </StyledBalance>
        </StyledBalanceWrapper>

        <StyledBalanceWrapper>
          <TokenSymbol symbol="STARDUST" />
          <StyledBalance>
            <StyledValue>{displayStardustBalance}</StyledValue>
            <Label text="STARDUST Available" />
          </StyledBalance>
        </StyledBalanceWrapper>
      </Balances>
    </Modal>
  );
};

const StyledValue = styled.div`
  //color: ${(props) => props.theme.color.grey[300]};
  font-size: 30px;
  font-weight: 700;
`;

const StyledBalance = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`;

const Balances = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spacing[4]}px;
`;

const StyledBalanceWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 ${(props) => props.theme.spacing[3]}px;
`;

export default AccountModal;
