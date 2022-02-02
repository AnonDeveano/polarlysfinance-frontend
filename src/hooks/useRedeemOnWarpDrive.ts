import { useCallback } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useRedeemOnWarpDrive = (description?: string) => {
  const polarlysFinance = usePolarlysFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleRedeem = useCallback(() => {
    const alertDesc = description || 'Redeem BOREALIS from WarpDrive';
    handleTransactionReceipt(polarlysFinance.exitFromWarpDrive(), alertDesc);
  }, [polarlysFinance, description, handleTransactionReceipt]);
  return { onRedeem: handleRedeem };
};

export default useRedeemOnWarpDrive;
