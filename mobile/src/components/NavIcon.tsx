import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  name: 'home' | 'sell' | 'buy' | 'history' | 'profile';
  size?: number;
  color?: string;
}

export const NavIcon: React.FC<Props> = ({ name, size = 20, color = '#64748b' }) => {
  const icons = {
    home: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 22V12h6v10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    sell: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 5v14M19 12l-7 7-7-7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    buy: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 19V5M5 12l7-7 7 7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    history: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 3v5h5M3.05 13a9 9 0 1 0 2.5-9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    profile: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  };

  return icons[name];
};