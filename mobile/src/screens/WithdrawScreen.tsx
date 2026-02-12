import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { CryptoIcon } from '../components/CryptoIcon';

interface Props {
  balance: { NGN: number; KES: number; BTC: number; ETH: number; USDT: number };
  userCountry: 'NG' | 'KE';
  userToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawScreen: React.FC<Props> = ({ balance, userCountry, userToken, onClose, onSuccess }) => {
  const [selectedAsset, setSelectedAsset] = useState<'NGN' | 'KES' | 'BTC' | 'ETH' | 'USDT'>('NGN');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const isCrypto = ['BTC', 'ETH', 'USDT'].includes(selectedAsset);
  const availableBalance = balance[selectedAsset] || 0;

  const handleWithdraw = async () => {
    if (!amount || !destination) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > availableBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://bpay-app.onrender.com/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset,
          amount: withdrawAmount,
          destination,
          type: isCrypto ? 'crypto' : 'fiat'
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Withdrawal request submitted');
        onSuccess();
      } else {
        Alert.alert('Error', 'Failed to process withdrawal');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Withdraw</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Asset</Text>
        
        <View style={styles.assetGrid}>
          {/* Fiat */}
          <TouchableOpacity
            style={[styles.assetCard, selectedAsset === 'NGN' && styles.selectedAsset]}
            onPress={() => setSelectedAsset('NGN')}
          >
            <Text style={styles.assetName}>NGN</Text>
            <Text style={styles.assetBalance}>₦{balance.NGN?.toLocaleString() || '0'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.assetCard, selectedAsset === 'KES' && styles.selectedAsset]}
            onPress={() => setSelectedAsset('KES')}
          >
            <Text style={styles.assetName}>KES</Text>
            <Text style={styles.assetBalance}>KSh{balance.KES?.toLocaleString() || '0'}</Text>
          </TouchableOpacity>

          {/* Crypto */}
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <TouchableOpacity
              key={crypto}
              style={[styles.assetCard, selectedAsset === crypto && styles.selectedAsset]}
              onPress={() => setSelectedAsset(crypto)}
            >
              <CryptoIcon crypto={crypto} size={24} />
              <Text style={styles.assetName}>{crypto}</Text>
              <Text style={styles.assetBalance}>
                {balance[crypto]?.toFixed(crypto === 'BTC' ? 6 : crypto === 'ETH' ? 4 : 2) || '0'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${selectedAsset} amount`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Text style={styles.available}>
            Available: {isCrypto 
              ? balance[selectedAsset]?.toFixed(selectedAsset === 'BTC' ? 6 : selectedAsset === 'ETH' ? 4 : 2) 
              : balance[selectedAsset]?.toLocaleString()} {selectedAsset}
          </Text>

          <Text style={styles.label}>
            {isCrypto ? 'Wallet Address' : 'Bank Account'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={isCrypto ? 'Enter wallet address' : 'Enter account number'}
            value={destination}
            onChangeText={setDestination}
          />

          <TouchableOpacity
            style={[styles.withdrawButton, loading && styles.disabledButton]}
            onPress={handleWithdraw}
            disabled={loading}
          >
            <Text style={styles.withdrawButtonText}>
              {loading ? 'Processing...' : 'Withdraw'}
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
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  assetCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAsset: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  assetName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 8,
  },
  assetBalance: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  label: {
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
    marginBottom: 8,
  },
  available: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
