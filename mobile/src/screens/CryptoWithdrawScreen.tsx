import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { CryptoIcon } from '../components/CryptoIcon';

interface Props {
  userBalance: { BTC: number; ETH: number; USDT: number };
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CryptoWithdrawScreen: React.FC<Props> = ({ userBalance, token, onClose, onSuccess }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const minWithdrawals = {
    BTC: 0.001,
    ETH: 0.01,
    USDT: 10
  };

  const handleWithdraw = async () => {
    if (!amount || !address) {
      Alert.alert('Error', 'Please enter amount and wallet address');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const balance = userBalance[selectedCrypto] || 0;

    if (withdrawAmount < minWithdrawals[selectedCrypto]) {
      Alert.alert('Error', `Minimum withdrawal is ${minWithdrawals[selectedCrypto]} ${selectedCrypto}`);
      return;
    }

    if (withdrawAmount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/luno/withdrawal/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 'current_user_id', // Replace with actual user ID
          currency: selectedCrypto,
          amount: withdrawAmount,
          address: address,
          reference: `Withdrawal ${Date.now()}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Withdrawal Initiated!',
          `Your ${selectedCrypto} withdrawal is being processed via Luno. Transaction ID: ${result.withdrawalId}`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to initiate withdrawal');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Withdraw Crypto</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cryptoSelector}>
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <TouchableOpacity
              key={crypto}
              style={[styles.cryptoOption, selectedCrypto === crypto && styles.selectedCrypto]}
              onPress={() => setSelectedCrypto(crypto)}
            >
              <CryptoIcon crypto={crypto} size={24} />
              <Text style={[styles.cryptoText, selectedCrypto === crypto && styles.selectedText]}>
                {crypto}
              </Text>
              <Text style={styles.balanceText}>
                {(userBalance[crypto] || 0).toFixed(8)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawTitle}>Withdraw {selectedCrypto}</Text>
          
          <Text style={styles.fieldLabel}>Amount</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputWithButton]}
              placeholder={`Enter ${selectedCrypto} amount`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.maxButton}
              onPress={() => setAmount((userBalance[selectedCrypto] || 0).toString())}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.limitsText}>
            Min: {minWithdrawals[selectedCrypto]} {selectedCrypto} | 
            Available: {(userBalance[selectedCrypto] || 0).toFixed(8)} {selectedCrypto}
          </Text>

          <Text style={styles.fieldLabel}>Wallet Address</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${selectedCrypto} wallet address`}
            value={address}
            onChangeText={setAddress}
            multiline
          />
          
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important</Text>
            <Text style={styles.warningText}>
              • Double-check the wallet address
              • Only send to {selectedCrypto} addresses
              • Withdrawals are processed via Luno
              • Network fees will be deducted
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.withdrawButton, isProcessing && styles.disabledButton]}
            onPress={handleWithdraw}
            disabled={isProcessing}
          >
            <Text style={styles.withdrawButtonText}>
              {isProcessing ? 'Processing...' : `Withdraw ${selectedCrypto}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 80,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  cryptoSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  cryptoOption: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 8,
  },
  selectedCrypto: {
    backgroundColor: '#f59e0b',
  },
  cryptoText: {
    fontWeight: 'bold',
    color: '#1a365d',
  },
  selectedText: {
    color: 'white',
  },
  balanceText: {
    fontSize: 12,
    color: '#64748b',
  },
  withdrawCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  withdrawTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWithButton: {
    flex: 1,
    marginBottom: 0,
  },
  maxButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  maxButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  limitsText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  withdrawButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});