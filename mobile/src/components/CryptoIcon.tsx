import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  crypto: 'BTC' | 'ETH' | 'USDT';
  size?: number;
}

const CRYPTO_LOGOS = {
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
};

export const CryptoIcon: React.FC<Props> = ({ crypto, size = 40 }) => {
  const iconSize = size;
  
  const BTCIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="btc" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f7931a" />
          <Stop offset="100%" stopColor="#f79800" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="12" fill="url(#btc)" />
      <Path
        d="M8.5 7.5h2.25c1.25 0 2.25 1 2.25 2.25s-1 2.25-2.25 2.25H8.5m0-4.5v4.5m0-4.5V6m0 6h2.75c1.25 0 2.25 1 2.25 2.25S12.5 16.5 11.25 16.5H8.5m0-4.5v4.5m0 0V18"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

  const ETHIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="eth" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#627eea" />
          <Stop offset="100%" stopColor="#3c3c3d" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="12" fill="url(#eth)" />
      <Path
        d="M12 3L6 12.5L12 16L18 12.5L12 3Z"
        fill="white"
        fillOpacity="0.8"
      />
      <Path
        d="M12 16L6 12.5L12 21L18 12.5L12 16Z"
        fill="white"
        fillOpacity="0.6"
      />
    </Svg>
  );

  const USDTIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#26a17b" />
      <Path
        d="M12.87 9.81c-1.78-.1-2.87-.53-2.87-1.17 0-.64 1.09-1.07 2.87-1.17V6h1.13v1.47c1.78.1 2.87.53 2.87 1.17 0 .64-1.09 1.07-2.87 1.17V18h-1.13V9.81z"
        fill="white"
      />
      <Path
        d="M8 8.5h8v1H8z"
        fill="white"
      />
    </Svg>
  );

  const renderIcon = () => {
    switch (crypto) {
      case 'BTC':
        return <BTCIcon />;
      case 'ETH':
        return <ETHIcon />;
      case 'USDT':
        return <USDTIcon />;
      default:
        return <BTCIcon />;
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: CRYPTO_LOGOS[crypto] }} 
        style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2 }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});