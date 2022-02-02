import { useEffect, useState } from 'react';
import usePolarlysFinance from '../usePolarlysFinance';
import { AllocationTime } from '../../polarlys-finance/types';

const useUnstakeTimerWarpDrive = () => {
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    if (polarlysFinance) {
      polarlysFinance.getUserUnstakeTime().then(setTime);
    }
  }, [polarlysFinance]);
  return time;
};

export default useUnstakeTimerWarpDrive;
