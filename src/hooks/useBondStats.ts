import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { TokenStat } from '../polarlys-finance/types';
import useRefresh from './useRefresh';

const useBondStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { slowRefresh } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchBondPrice() {
      try {
        setStat(await polarlysFinance.gestarDustStat());
      }
      catch (err) {
        console.error(err);
      }
    }
    fetchBondPrice();
  }, [setStat, polarlysFinance, slowRefresh]);

  return stat;
};

export default useBondStats;
