import { useCallback, useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import config from '../config';
import { BigNumber } from 'ethers';

const useCashPriceInLastTWAP = () => {
  const [price, setPrice] = useState<BigNumber>(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();

  const fetchCashPrice = useCallback(async () => {
    setPrice(await polarlysFinance.getNebulaPriceInLastTWAP());
  }, [polarlysFinance]);

  useEffect(() => {
    fetchCashPrice().catch((err) => console.error(`Failed to fetch NEBULA price: ${err.stack}`));
    const refreshInterval = setInterval(fetchCashPrice, config.refreshInterval);
    return () => clearInterval(refreshInterval);
  }, [setPrice, polarlysFinance, fetchCashPrice]);

  return price;
};

export default useCashPriceInLastTWAP;
