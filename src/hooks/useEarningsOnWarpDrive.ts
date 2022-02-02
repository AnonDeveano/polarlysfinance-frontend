import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import usePolarlysFinance from './usePolarlysFinance';
import useRefresh from './useRefresh';

const useEarningsOnWarpDrive = () => {
  const { slowRefresh } = useRefresh();
  const [balance, setBalance] = useState(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();
  const isUnlocked = polarlysFinance?.isUnlocked;

  useEffect(() => {
    async function fetchBalance() {
      try {
        setBalance(await polarlysFinance.getEarningsOnWarpDrive());
      } catch (e) {
        console.error(e);
      }
    }
    if (isUnlocked) {
      fetchBalance();
    }
  }, [isUnlocked, polarlysFinance, slowRefresh]);

  return balance;
};

export default useEarningsOnWarpDrive;
