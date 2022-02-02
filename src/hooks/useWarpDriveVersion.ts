import { useCallback, useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useStakedBalanceOnWarpDrive from './useStakedBalanceOnWarpDrive';

const useWarpDriveVersion = () => {
  const [warpdriveVersion, setWarpDriveVersion] = useState('latest');
  const polarlysFinance = usePolarlysFinance();
  const stakedBalance = useStakedBalanceOnWarpDrive();

  const updateState = useCallback(async () => {
    setWarpDriveVersion(await polarlysFinance.fetchWarpDriveVersionOfUser());
  }, [polarlysFinance?.isUnlocked, stakedBalance]);

  useEffect(() => {
    if (polarlysFinance?.isUnlocked) {
      updateState().catch((err) => console.error(err.stack));
    }
  }, [polarlysFinance?.isUnlocked, stakedBalance]);

  return warpdriveVersion;
};

export default useWarpDriveVersion;
