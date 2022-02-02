import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { TokenStat } from '../polarlys-finance/types';
import useRefresh from './useRefresh';

const useNebulaStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { fastRefresh } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchNebulaPrice() {
      try {
        setStat(await polarlysFinance.getNebulaStat());
      }
      catch (err) {
        console.error(err)
      }
    }
    fetchNebulaPrice();
  }, [setStat, polarlysFinance, fastRefresh]);

  return stat;
};

export default useNebulaStats;
