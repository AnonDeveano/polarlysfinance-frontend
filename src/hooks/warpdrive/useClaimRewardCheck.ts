import { useEffect, useState } from 'react';
import useRefresh from '../useRefresh';
import usePolarlysFinance from './../usePolarlysFinance';

const useClaimRewardCheck = () => {
  const { slowRefresh } = useRefresh();
  const [canClaimReward, setCanClaimReward] = useState(false);
  const polarlysFinance = usePolarlysFinance();
  const isUnlocked = polarlysFinance?.isUnlocked;

  useEffect(() => {
    async function canUserClaimReward() {
      try {
        setCanClaimReward(await polarlysFinance.canUserClaimRewardFromWarpDrive());
      } catch (err) {
        console.error(err);
      };
    }
    if (isUnlocked) {
      canUserClaimReward();
    }
  }, [isUnlocked, slowRefresh, polarlysFinance]);

  return canClaimReward;
};

export default useClaimRewardCheck;
