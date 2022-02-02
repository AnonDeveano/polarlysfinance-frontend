import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { LPStat } from '../polarlys-finance/types';
import useRefresh from './useRefresh';

const useLpStats = (lpTicker: string) => {
  const [stat, setStat] = useState<LPStat>();
  const { slowRefresh } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchLpPrice() {
      try {
        setStat(await polarlysFinance.getLPStat(lpTicker));
      }
      catch (err) {
        console.error(err);
      }
    }
    fetchLpPrice();
  }, [setStat, polarlysFinance, slowRefresh, lpTicker]);

  return stat;
};

export default useLpStats;
