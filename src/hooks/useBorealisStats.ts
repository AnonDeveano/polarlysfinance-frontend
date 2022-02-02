import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { TokenStat } from '../polarlys-finance/types';
import useRefresh from './useRefresh';

const useBorealisStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { slowRefresh } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchSharePrice() {
      try {
        setStat(await polarlysFinance.geborealisStat());
      } catch (err) {
        console.error(err)
      }
    }
    fetchSharePrice();
  }, [setStat, polarlysFinance, slowRefresh]);

  return stat;
};

export default useBorealisStats;
