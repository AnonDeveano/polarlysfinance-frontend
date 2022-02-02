import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useWithdrawFromWarpDrive = () => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleWithdraw = useCallback(
    (amount: string) => {
      handleTransactionReceipt(
        polarlysFinance.withdrawBorealisFromWarpDrive(amount),
        `Withdraw ${amount} BOREALIS from the warp drive`,
      );
    },
    [polarlysFinance, handleTransactionReceipt],
  );
  return { onWithdraw: handleWithdraw };
};

export default useWithdrawFromWarpDrive;
