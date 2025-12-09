import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function WithdrawScreen() {
  const [currency, setCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [withdrawType, setWithdrawType] = useState('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    fetchBalance();
  }, [currency]);

  const fetchBalance = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE}/user/balance`, {
        headers: { 'user-id': userId }
      });
      const data = await response.json();
      setBalance(data[currency.toLowerCase()] || 0);
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (withdrawType === 'bank' && (!bankName || !accountNumber || !accountName)) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    if (withdrawType === 'crypto' && !walletAddress) {
      Alert.alert('Error', 'Please enter wallet address');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE}/withdrawals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          currency,
          walletAddress: withdrawType === 'crypto' ? walletAddress : null,
          bankDetails: withdrawType === 'bank' ? { bankName, accountNumber, accountName } : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setWalletAddress('');
        fetchBalance();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create withdrawal request');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💸 Withdraw Funds</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {currency === 'NGN' ? '₦' : currency === 'KES' ? 'KSh' : ''}{balance.toLocaleString()}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select Currency</Text>
        <View style={styles.currencyButtons}>
          {['NGN', 'KES', 'BTC', 'ETH', 'USDT'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.currencyButton, currency === c && styles.currencyButtonActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.currencyButtonText, currency === c && styles.currencyButtonTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Withdrawal Type</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[styles.typeButton, withdrawType === 'bank' && styles.typeButtonActive]}
            onPress={() => setWithdrawType('bank')}
          >
            <Text style={[styles.typeButtonText, withdrawType === 'bank' && styles.typeButtonTextActive]}>🏦 Bank Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, withdrawType === 'crypto' && styles.typeButtonActive]}
            onPress={() => setWithdrawType('crypto')}
          >
            <Text style={[styles.typeButtonText, withdrawType === 'crypto' && styles.typeButtonTextActive]}>₿ Crypto Wallet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {withdrawType === 'bank' ? (
          <>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank name"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account name"
              value={accountName}
              onChangeText={setAccountName}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Wallet Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter wallet address"
              value={walletAddress}
              onChangeText={setWalletAddress}
            />
          </>
        )}

        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <Text style={styles.withdrawButtonText}>Submit Withdrawal Request</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>ℹ️ Withdrawals are processed within 24 hours by our admin team</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  balanceCard: { backgroundColor: '#f59e0b', margin: 16, padding: 24, borderRadius: 20, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: '#fff', opacity: 0.9 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 16, marginBottom: 8 },
  currencyButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0' },
  currencyButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  currencyButtonText: { fontWeight: 'bold', color: '#64748b' },
  currencyButtonTextActive: { color: '#fff' },
  typeButtons: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  typeButtonText: { fontWeight: 'bold', color: '#64748b' },
  typeButtonTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16 },
  withdrawButton: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  withdrawButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoBox: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, marginTop: 16 },
  infoText: { fontSize: 12, color: '#92400e', textAlign: 'center' }
});
