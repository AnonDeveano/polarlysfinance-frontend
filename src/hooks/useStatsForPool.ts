import { useCallback, useState, useEffect } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { Bank } from '../polarlys-finance';
import { PoolStats } from '../polarlys-finance/types';
import config from '../config';

const useStatsForPool = (bank: Bank) => {
  const polarlysFinance = usePolarlysFinance();

  const [poolAPRs, setPoolAPRs] = useState<PoolStats>();

  const fetchAPRsForPool = useCallback(async () => {
    setPoolAPRs(await polarlysFinance.getPoolAPRs(bank));
  }, [polarlysFinance, bank]);

  useEffect(() => {
    fetchAPRsForPool().catch((err) => console.error(`Failed to fetch STARDUST price: ${err.stack}`));
    const refreshInterval = setInterval(fetchAPRsForPool, config.refreshInterval);
    return () => clearInterval(refreshInterval);
  }, [setPoolAPRs, polarlysFinance, fetchAPRsForPool]);

  return poolAPRs;
};

export default useStatsForPool;
