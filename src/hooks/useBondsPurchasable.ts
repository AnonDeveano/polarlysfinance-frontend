import { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import ERC20 from '../polarlys-finance/ERC20';
import usePolarlysFinance from './usePolarlysFinance';
import config from '../config';

const useBondsPurchasable = () => {
  const [balance, setBalance] = useState(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    async function fetchBondsPurchasable() {
      try {
        setBalance(await polarlysFinance.gestarDustsPurchasable());
      }
      catch (err) {
        console.error(err);
      }
    }
    fetchBondsPurchasable();
  }, [setBalance, polarlysFinance]);

  return balance;
};

export default useBondsPurchasable;
