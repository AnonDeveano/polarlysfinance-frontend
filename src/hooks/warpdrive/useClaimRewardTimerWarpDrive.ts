import { useEffect, useState } from 'react';
import usePolarlysFinance from '../usePolarlysFinance';
import { AllocationTime } from '../../polarlys-finance/types';

const useClaimRewardTimerWarpDrive = () => {
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    if (polarlysFinance) {
      polarlysFinance.getUserClaimRewardTime().then(setTime);
    }
  }, [polarlysFinance]);
  return time;
};

export default useClaimRewardTimerWarpDrive;
