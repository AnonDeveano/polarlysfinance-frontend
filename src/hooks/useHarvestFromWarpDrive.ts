import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useHarvestFromWarpDrive = () => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleReward = useCallback(() => {
    handleTransactionReceipt(polarlysFinance.harvestCashFromWarpDrive(), 'Claim NEBULA from WarpDrive');
  }, [polarlysFinance, handleTransactionReceipt]);

  return { onReward: handleReward };
};

export default useHarvestFromWarpDrive;
