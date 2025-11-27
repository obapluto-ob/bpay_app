import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function TradeScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Trade Crypto</Text>
          <Text style={styles.subtitle}>Buy/Sell Bitcoin, Ethereum, USDT</Text>
        </Card.Content>
      </Card>
      
      <Button mode="contained" style={styles.button}>
        Buy Bitcoin
      </Button>
      
      <Button mode="outlined" style={styles.button}>
        Sell Bitcoin
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    marginBottom: 10,
  },
});