import { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import usePolarlysFinance from './usePolarlysFinance';
import { ContractName } from '../polarlys-finance';
import config from '../config';

const useEarnings = (poolName: ContractName, earnTokenName: String, poolId: Number) => {
  const [balance, setBalance] = useState(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();
  const isUnlocked = polarlysFinance?.isUnlocked;

  const fetchBalance = useCallback(async () => {
    const balance = await polarlysFinance.earnedFromBank(poolName, earnTokenName, poolId, polarlysFinance.myAccount);
    setBalance(balance);
  }, [poolName, earnTokenName, poolId, polarlysFinance]);

  useEffect(() => {
    if (isUnlocked) {
      fetchBalance().catch((err) => console.error(err.stack));

      const refreshBalance = setInterval(fetchBalance, config.refreshInterval);
      return () => clearInterval(refreshBalance);
    }
  }, [isUnlocked, poolName, polarlysFinance, fetchBalance]);

  return balance;
};

export default useEarnings;
