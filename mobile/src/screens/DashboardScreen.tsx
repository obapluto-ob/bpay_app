import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function DashboardScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Welcome to BPay</Text>
          <Text style={styles.balance}>Balance: ₦0.00</Text>
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Trade')}
        style={styles.button}
      >
        Start Trading
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
  balance: {
    fontSize: 18,
    color: '#f97316',
  },
  button: {
    marginTop: 20,
  },
});