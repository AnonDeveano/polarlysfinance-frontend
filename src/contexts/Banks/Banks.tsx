import React, { useCallback, useEffect, useState } from 'react';
import Context from './context';
import usePolarlysFinance from '../../hooks/usePolarlysFinance';
import { Bank } from '../../polarlys-finance';
import config, { bankDefinitions } from '../../config';

const Banks: React.FC = ({ children }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const polarlysFinance = usePolarlysFinance();
  const isUnlocked = polarlysFinance?.isUnlocked;

  const fetchPools = useCallback(async () => {
    const banks: Bank[] = [];

    for (const bankInfo of Object.values(bankDefinitions)) {
      if (bankInfo.finished) {
        if (!polarlysFinance.isUnlocked) continue;

        // only show pools staked by user
        const balance = await polarlysFinance.stakedBalanceOnBank(
          bankInfo.contract,
          bankInfo.poolId,
          polarlysFinance.myAccount,
        );
        if (balance.lte(0)) {
          continue;
        }
      }
      banks.push({
        ...bankInfo,
        address: config.deployments[bankInfo.contract].address,
        depositToken: polarlysFinance.externalTokens[bankInfo.depositTokenName],
        earnToken: bankInfo.earnTokenName === 'NEBULA' ? polarlysFinance.NEBULA : polarlysFinance.BOREALIS,
      });
    }
    banks.sort((a, b) => (a.sort > b.sort ? 1 : -1));
    setBanks(banks);
  }, [polarlysFinance, setBanks]);

  useEffect(() => {
    if (polarlysFinance) {
      fetchPools().catch((err) => console.error(`Failed to fetch pools: ${err.stack}`));
    }
  }, [isUnlocked, polarlysFinance, fetchPools]);

  return <Context.Provider value={{ banks }}>{children}</Context.Provider>;
};

export default Banks;
