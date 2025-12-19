import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

export default function SasaPayTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  const testSasaPay = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://bpay-app.onrender.com/api/sasapay-test/test-stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''), // Remove non-digits
          amount: parseFloat(amount)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success!', 'SasaPay integration is working. Check your phone for M-Pesa prompt.');
      } else {
        Alert.alert('Status', result.message || 'SasaPay test completed. Check console for details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test SasaPay Integration</Text>
      
      <Text style={styles.label}>Phone Number (254...)</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="254712345678"
        keyboardType="phone-pad"
      />
      
      <Text style={styles.label}>Amount (KES)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="10"
        keyboardType="numeric"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testSasaPay}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test SasaPay'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        This will test if SasaPay integration is working. 
        You may receive an M-Pesa prompt if credentials are active.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5', flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: 'white',
    marginBottom: 15 
  },
  button: { 
    backgroundColor: '#f59e0b', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: 15
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  note: { fontSize: 12, color: '#666', textAlign: 'center', fontStyle: 'italic' }
});