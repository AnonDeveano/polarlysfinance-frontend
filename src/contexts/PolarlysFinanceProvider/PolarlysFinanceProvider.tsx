import React, { createContext, useEffect, useState } from 'react';
import { useWallet } from 'use-wallet';
import PolarlysFinance from '../../polarlys-finance';
import config from '../../config';

export interface PolarlysFinanceContext {
  polarlysFinance?: PolarlysFinance;
}

export const Context = createContext<PolarlysFinanceContext>({ polarlysFinance: null });

export const PolarlysFinanceProvider: React.FC = ({ children }) => {
  const { ethereum, account } = useWallet();
  const [polarlysFinance, setPolarlysFinance] = useState<PolarlysFinance>();

  useEffect(() => {
    if (!polarlysFinance) {
      const nebula = new PolarlysFinance(config);
      if (account) {
        // wallet was unlocked at initialization
        nebula.unlockWallet(ethereum, account);
      }
      setPolarlysFinance(nebula);
    } else if (account) {
      polarlysFinance.unlockWallet(ethereum, account);
    }
  }, [account, ethereum, polarlysFinance]);

  return <Context.Provider value={{ polarlysFinance }}>{children}</Context.Provider>;
};
