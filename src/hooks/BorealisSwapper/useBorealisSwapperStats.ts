import { useEffect, useState } from 'react';
import usePolarlysFinance from '../usePolarlysFinance';
import { BorealisSwapperStat } from '../../polarlys-finance/types';
import useRefresh from '../useRefresh';

const useBorealisSwapperStats = (account: string) => {
  const [stat, setStat] = useState<BorealisSwapperStat>();
  const { fastRefresh/*, slowRefresh*/ } = useRefresh();
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchBorealisSwapperStat() {
      try {
        if (polarlysFinance.myAccount) {
          setStat(await polarlysFinance.getBorealisSwapperStat(account));
        }
      }
      catch (err) {
        console.error(err);
      }
    }
    fetchBorealisSwapperStat();
  }, [setStat, polarlysFinance, fastRefresh, account]);

  return stat;
};

export default useBorealisSwapperStats;