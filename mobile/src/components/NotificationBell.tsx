import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  unreadCount: number;
  onPress: () => void;
}

export const NotificationBell: React.FC<Props> = ({ unreadCount, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});