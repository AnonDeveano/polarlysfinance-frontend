import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';
import { Bank } from '../polarlys-finance';

const useHarvest = (bank: Bank) => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleReward = useCallback(() => {
    handleTransactionReceipt(
      polarlysFinance.harvest(bank.contract, bank.poolId),
      `Claim ${bank.earnTokenName} from ${bank.contract}`,
    );
  }, [bank, polarlysFinance, handleTransactionReceipt]);

  return { onReward: handleReward };
};

export default useHarvest;
