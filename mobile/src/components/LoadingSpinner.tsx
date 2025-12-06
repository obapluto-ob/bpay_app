import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<Props> = ({ message = 'Loading...', size = 'large' }) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color="#f59e0b" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a365d',
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});