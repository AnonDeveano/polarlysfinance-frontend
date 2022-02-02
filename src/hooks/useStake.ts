import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { Bank } from '../polarlys-finance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';
import { parseUnits } from 'ethers/lib/utils';

const useStake = (bank: Bank) => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleStake = useCallback(
    (amount: string) => {
      const amountBn = parseUnits(amount, bank.depositToken.decimal);
      handleTransactionReceipt(
        polarlysFinance.stake(bank.contract, bank.poolId, amountBn),
        `Stake ${amount} ${bank.depositTokenName} to ${bank.contract}`,
      );
    },
    [bank, polarlysFinance, handleTransactionReceipt],
  );
  return { onStake: handleStake };
};

export default useStake;
