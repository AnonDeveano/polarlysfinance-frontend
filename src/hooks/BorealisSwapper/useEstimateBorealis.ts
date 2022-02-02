import { useCallback, useEffect, useState } from 'react';
import usePolarlysFinance from '../usePolarlysFinance';
import { useWallet } from 'use-wallet';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

const useEstimateBorealis = (stardustAmount: string) => {
  const [estimateAmount, setEstimateAmount] = useState<string>('');
  const { account } = useWallet();
  const polarlysFinance = usePolarlysFinance();

  const estimateAmountOfBorealis = useCallback(async () => {
    const stardustAmountBn = parseUnits(stardustAmount);
    const amount = await polarlysFinance.estimateAmountOfBorealis(stardustAmountBn.toString());
    setEstimateAmount(amount);
  }, [account]);

  useEffect(() => {
    if (account) {
      estimateAmountOfBorealis().catch((err) => console.error(`Failed to get estimateAmountOfBorealis: ${err.stack}`));
    }
  }, [account, estimateAmountOfBorealis]);

  return estimateAmount;
};

export default useEstimateBorealis;