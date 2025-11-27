import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BPay Mobile</Text>
      <Text style={styles.subtitle}>Easy Bitcoin Payments</Text>
      
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Dashboard')}
        style={styles.button}
      >
        Login to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f97316',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 40,
  },
  button: {
    marginTop: 20,
    width: 200,
  },
});