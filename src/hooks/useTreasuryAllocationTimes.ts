import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { AllocationTime } from '../polarlys-finance/types';
import useRefresh from './useRefresh';


const useTreasuryAllocationTimes = () => {
  const { slowRefresh } = useRefresh();
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const polarlysFinance = usePolarlysFinance();
  useEffect(() => {
    if (polarlysFinance) {
      polarlysFinance.getTreasuryNextAllocationTime().then(setTime);
    }
  }, [polarlysFinance, slowRefresh]);
  return time;
};

export default useTreasuryAllocationTimes;
