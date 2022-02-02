import React from 'react';

//Graveyard ecosystem logos
import nebulaLogo from '../../assets/img/crypto_nebula_cash.svg';
import borealisLogo from '../../assets/img/crypto_nebula_share.svg';
import nebulaLogoPNG from '../../assets/img/crypto_nebula_cash.f2b44ef4.png';
import borealisLogoPNG from '../../assets/img/crypto_nebula_share.bf1a6c52.png';
import starDustLogo from '../../assets/img/crypto_nebula_bond.svg';

import nebulaNearLpLogo from '../../assets/img/nebula_near_lp.png';
import borealisNearLpLogo from '../../assets/img/borealis_near_lp.png';

import wnearLogo from '../../assets/img/near_logo_blue.svg';
import booLogo from '../../assets/img/spooky.png';
import zooLogo from '../../assets/img/zoo_logo.svg';
import shibaLogo from '../../assets/img/shiba_logo.svg';

const logosBySymbol: { [title: string]: string } = {
  //Real tokens
  //=====================
  NEBULA: nebulaLogo,
  NEBULAPNG: nebulaLogoPNG,
  BOREALISPNG: borealisLogoPNG,
  BOREALIS: borealisLogo,
  STARDUST: starDustLogo,
  WNEAR: wnearLogo,
  BOO: booLogo,
  SHIBA: shibaLogo,
  ZOO: zooLogo,
  'NEBULA-NEAR-LP': nebulaNearLpLogo,
  'BOREALIS-NEAR-LP': borealisNearLpLogo,
};

type LogoProps = {
  symbol: string;
  size?: number;
};

const TokenSymbol: React.FC<LogoProps> = ({ symbol, size = 64 }) => {
  if (!logosBySymbol[symbol]) {
    throw new Error(`Invalid Token Logo symbol: ${symbol}`);
  }
  return <img src={logosBySymbol[symbol]} alt={`${symbol} Logo`} width={size} height={size} />;
};

export default TokenSymbol;
