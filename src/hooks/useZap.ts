import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { Bank } from '../polarlys-finance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useZap = (bank: Bank) => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleZap = useCallback(
    (zappingToken: string, tokenName: string, amount: string) => {
      handleTransactionReceipt(
        polarlysFinance.zapIn(zappingToken, tokenName, amount),
        `Zap ${amount} in ${bank.depositTokenName}.`,
      );
    },
    [bank, polarlysFinance, handleTransactionReceipt],
  );
  return { onZap: handleZap };
};

export default useZap;
