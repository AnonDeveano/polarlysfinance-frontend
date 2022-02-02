import { useEffect, useState } from 'react';
import usePolarlysFinance from './../usePolarlysFinance';
import useRefresh from '../useRefresh';

const useWithdrawCheck = () => {
  const [canWithdraw, setCanWithdraw] = useState(false);
  const polarlysFinance = usePolarlysFinance();
  const { slowRefresh } = useRefresh();
  const isUnlocked = polarlysFinance?.isUnlocked;

  useEffect(() => {
    async function canUserWithdraw() {
      try {
        setCanWithdraw(await polarlysFinance.canUserUnstakeFromWarpDrive());
      } catch (err) {
        console.error(err);
      }
    }
    if (isUnlocked) {
      canUserWithdraw();
    }
  }, [isUnlocked, polarlysFinance, slowRefresh]);

  return canWithdraw;
};

export default useWithdrawCheck;
