import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  provider: string;
  size?: number;
}

export const PaymentIcon: React.FC<Props> = ({ provider, size = 24 }) => {
  const iconSize = size;
  
  const MPesaIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#00a651" />
      <Path
        d="M6 8h4v8H6zm6-2h4v12h-4z"
        fill="white"
      />
      <Path
        d="M7 10h2v4H7zm7 8h2v2h-2z"
        fill="#00a651"
      />
    </Svg>
  );

  const AirtelIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#ff0000" />
      <Path
        d="M8 6l8 6-8 6V6z"
        fill="white"
      />
      <Circle cx="12" cy="12" r="2" fill="#ff0000" />
    </Svg>
  );

  const TKashIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#ff6600" />
      <Path
        d="M6 8h12v2H6zm4 4h8v2h-8zm-4 4h12v2H6z"
        fill="white"
      />
      <Path
        d="M8 10h2v6H8z"
        fill="white"
      />
    </Svg>
  );

  const OPayIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="opay" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#01c853" />
          <Stop offset="100%" stopColor="#00a644" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="12" fill="url(#opay)" />
      <Circle cx="12" cy="12" r="6" fill="white" />
      <Circle cx="12" cy="12" r="3" fill="#01c853" />
    </Svg>
  );

  const PalmPayIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#6c5ce7" />
      <Path
        d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z"
        fill="white"
      />
      <Path
        d="M10 10h4v4h-4z"
        fill="#6c5ce7"
      />
    </Svg>
  );

  const KudaIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#40196d" />
      <Path
        d="M8 8h8v8H8z"
        fill="white"
      />
      <Path
        d="M10 10h4v4h-4z"
        fill="#40196d"
      />
    </Svg>
  );

  const MoniepointIcon = () => (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#0066cc" />
      <Path
        d="M7 9h10v6H7z"
        fill="white"
      />
      <Circle cx="12" cy="12" r="2" fill="#0066cc" />
    </Svg>
  );

  const renderIcon = () => {
    switch (provider) {
      case 'M-Pesa':
        return <MPesaIcon />;
      case 'Airtel Money':
        return <AirtelIcon />;
      case 'T-Kash':
        return <TKashIcon />;
      case 'OPay':
        return <OPayIcon />;
      case 'PalmPay':
        return <PalmPayIcon />;
      case 'Kuda':
        return <KudaIcon />;
      case 'Moniepoint':
        return <MoniepointIcon />;
      default:
        return <Circle cx="12" cy="12" r="12" fill="#64748b" />;
    }
  };

  return <View style={styles.container}>{renderIcon()}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});