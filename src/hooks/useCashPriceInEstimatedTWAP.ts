import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import { TokenStat } from '../polarlys-finance/types';
import useRefresh from './useRefresh';

const useCashPriceInEstimatedTWAP = () => {
  const [stat, setStat] = useState<TokenStat>();
  const polarlysFinance = usePolarlysFinance();
  const { slowRefresh } = useRefresh();

  useEffect(() => {
    async function fetchCashPrice() {
      try {
        setStat(await polarlysFinance.getNebulaStatInEstimatedTWAP());
      } catch (err) {
        console.error(err);
      }
    }
    fetchCashPrice();
  }, [setStat, polarlysFinance, slowRefresh]);

  return stat;
};

export default useCashPriceInEstimatedTWAP;
