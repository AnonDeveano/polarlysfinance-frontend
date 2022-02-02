import { useContext } from 'react';
import { Context } from '../contexts/PolarlysFinanceProvider';

const usePolarlysFinance = () => {
  const { polarlysFinance } = useContext(Context);
  return polarlysFinance;
};

export default usePolarlysFinance;
