import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useRefresh from './useRefresh';

const useTotalValueLocked = () => {
  const [totalValueLocked, setTotalValueLocked] = useState<Number>(0);
  const { slowRefresh } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchTVL() {
      try {
        setTotalValueLocked(await polarlysFinance.getTotalValueLocked());
      }
      catch (err) {
        console.error(err);
      }
    }
    fetchTVL();
  }, [setTotalValueLocked, polarlysFinance, slowRefresh]);

  return totalValueLocked;
};

export default useTotalValueLocked;
