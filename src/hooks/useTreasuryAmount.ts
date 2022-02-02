import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import usePolarlysFinance from './usePolarlysFinance';

const useTreasuryAmount = () => {
  const [amount, setAmount] = useState(BigNumber.from(0));
  const polarlysFinance = usePolarlysFinance();

  useEffect(() => {
    if (polarlysFinance) {
      const { Treasury } = polarlysFinance.contracts;
      polarlysFinance.NEBULA.balanceOf(Treasury.address).then(setAmount);
    }
  }, [polarlysFinance]);
  return amount;
};

export default useTreasuryAmount;
