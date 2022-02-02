import { useCallback } from 'react';
import usePolarlysFinance from '../usePolarlysFinance';
import useHandleTransactionReceipt from '../useHandleTransactionReceipt';
// import { BigNumber } from "ethers";
import { parseUnits } from 'ethers/lib/utils';


const useSwapStardustToBorealis = () => {
	const polarlysFinance = usePolarlysFinance();
	const handleTransactionReceipt = useHandleTransactionReceipt();

	const handleSwapBorealis = useCallback(
		(stardustAmount: string) => {
			const stardustAmountBn = parseUnits(stardustAmount, 18);
			handleTransactionReceipt(
				polarlysFinance.swapStardustToBorealis(stardustAmountBn),
				`Swap ${stardustAmount} StarDust to Borealis`
			);
		},
		[polarlysFinance, handleTransactionReceipt]
	);
	return { onSwapBorealis: handleSwapBorealis };
};

export default useSwapStardustToBorealis;