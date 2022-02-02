import { useEffect, useState } from 'react';
import usePolarlysFinance from './usePolarlysFinance';
import useRefresh from './useRefresh';

const useFetchWarpDriveAPR = () => {
  const [apr, setApr] = useState<number>(0);
  const polarlysFinance = usePolarlysFinance();
  const { slowRefresh } = useRefresh();

  useEffect(() => {
    async function fetchWarpDriveAPR() {
      try {
        setApr(await polarlysFinance.getWarpDriveAPR());
      } catch (err) {
        console.error(err);
      }
    }
    fetchWarpDriveAPR();
  }, [setApr, polarlysFinance, slowRefresh]);

  return apr;
};

export default useFetchWarpDriveAPR;
