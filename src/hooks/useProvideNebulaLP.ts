import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';
import { parseUnits } from 'ethers/lib/utils';
import { TAX_OFFICE_ADDR } from '../utils/constants'

const useProvideNebulaLP = () => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleProvideNebulaNearLP = useCallback(
    (nearAmount: string, nebulaAmount: string) => {
      const nebulaAmountBn = parseUnits(nebulaAmount);
      handleTransactionReceipt(
        polarlysFinance.provideNebulaNearLP(nearAmount, nebulaAmountBn),
        `Provide Nebula-NEAR LP ${nebulaAmount} ${nearAmount} using ${TAX_OFFICE_ADDR}`,
      );
    },
    [polarlysFinance, handleTransactionReceipt],
  );
  return { onProvideNebulaNearLP: handleProvideNebulaNearLP };
};

export default useProvideNebulaLP;
