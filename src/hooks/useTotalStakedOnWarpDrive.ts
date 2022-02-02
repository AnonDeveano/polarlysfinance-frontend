import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import usePolarlysFinance from './usePolarlysFinance';
import useRefresh from './useRefresh';

const useTotalStakedOnWarpDrive = () => {
  const [totalStaked, setTotalStaked] = useState(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();
  const { slowRefresh } = useRefresh();
  const isUnlocked = polarlysFinance?.isUnlocked;

  useEffect(() => {
    async function fetchTotalStaked() {
      try {
        setTotalStaked(await polarlysFinance.getTotalStakedInWarpDrive());
      } catch (err) {
        console.error(err);
      }
    }
    if (isUnlocked) {
      fetchTotalStaked();
    }
  }, [isUnlocked, slowRefresh, polarlysFinance]);

  return totalStaked;
};

export default useTotalStakedOnWarpDrive;
