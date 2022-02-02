import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { Bank } from '../polarlys-finance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useRedeem = (bank: Bank) => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleRedeem = useCallback(() => {
    handleTransactionReceipt(polarlysFinance.exit(bank.contract, bank.poolId), `Redeem ${bank.contract}`);
  }, [bank, polarlysFinance, handleTransactionReceipt]);

  return { onRedeem: handleRedeem };
};

export default useRedeem;
