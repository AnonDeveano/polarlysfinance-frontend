import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useStakeToWarpDrive = () => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleStake = useCallback(
    (amount: string) => {
      handleTransactionReceipt(polarlysFinance.stakeShareToWarpDrive(amount), `Stake ${amount} BOREALIS to the warpdrive`);
    },
    [polarlysFinance, handleTransactionReceipt],
  );
  return { onStake: handleStake };
};

export default useStakeToWarpDrive;
