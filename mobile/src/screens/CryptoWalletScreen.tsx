import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Clipboard } from 'react-native';
import { CryptoWallet, CryptoDeposit } from '../types';
import { apiService } from '../services/api';
import { CryptoIcon } from '../components/CryptoIcon';

interface Props {
  wallets: CryptoWallet;
  onClose: () => void;
  onSuccess: () => void;
  userToken: string;
}

export const CryptoWalletScreen: React.FC<Props> = ({ wallets, onClose, onSuccess, userToken }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const copyAddress = (address: string, crypto: string) => {
    Clipboard.setString(address);
    Alert.alert('Copied!', `${crypto} address copied to clipboard`);
  };

  const handleDepositVerification = async () => {
    if (!txHash || !amount) {
      Alert.alert('Error', 'Please enter transaction hash and amount');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyDeposit(userToken, {
        crypto: selectedCrypto,
        txHash,
        amount: parseFloat(amount)
      });

      if (result.verified) {
        Alert.alert(
          'Deposit Verified!',
          `${amount} ${selectedCrypto} has been added to your wallet`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        Alert.alert('Verification Failed', 'Transaction not found or already used');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crypto Wallet</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Select cryptocurrency to deposit:</Text>
        
        <View style={styles.walletGrid}>
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <TouchableOpacity
              key={crypto}
              style={[styles.walletCard, selectedCrypto === crypto && styles.selectedWallet]}
              onPress={() => setSelectedCrypto(crypto)}
            >
              <View style={styles.walletIcon}>
                <CryptoIcon crypto={crypto} size={40} />
              </View>
              <Text style={styles.walletName}>{crypto} Wallet</Text>
              <Text style={styles.walletNetwork}>
                {crypto === 'BTC' ? 'Bitcoin Network' : crypto === 'ETH' ? 'Ethereum Network' : 'ERC-20 Network'}
              </Text>
              {selectedCrypto === crypto && <View style={styles.selectedIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>{selectedCrypto} Deposit Address</Text>
          {wallets[selectedCrypto] ? (
            <View style={styles.addressContainer}>
              <Text style={styles.address}>{wallets[selectedCrypto]}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyAddress(wallets[selectedCrypto], selectedCrypto)}
              >
                <Text style={styles.copyButtonText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.comingSoonContainer}>
              <View style={styles.rocketIcon}>
                <View style={styles.rocketBody} />
                <View style={styles.rocketTip} />
                <View style={styles.rocketFin1} />
                <View style={styles.rocketFin2} />
              </View>
              <Text style={styles.comingSoonTitle}>Wallet Integration</Text>
              <Text style={styles.comingSoonText}>
                {selectedCrypto} deposits are being integrated with our secure infrastructure.
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '92%' }]} />
              </View>
              <Text style={styles.progressText}>92% Complete • Expected: 2-3 days</Text>
            </View>
          )}
          
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Important Instructions</Text>
            <Text style={styles.warningText}>
              • Only send {selectedCrypto} to this address
            </Text>
            <Text style={styles.warningText}>
              • Minimum deposit: {selectedCrypto === 'BTC' ? '0.001 BTC' : selectedCrypto === 'ETH' ? '0.01 ETH' : '10 USDT'}
            </Text>
            <Text style={styles.warningText}>
              • Network: {selectedCrypto === 'USDT' ? 'ERC-20 (Ethereum)' : selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'}
            </Text>
            <Text style={styles.warningText}>
              • Deposits are automatically verified using blockchain API
            </Text>
          </View>
        </View>

        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Verify Your Deposit</Text>
          <Text style={styles.verificationSubtitle}>
            After sending crypto, paste your transaction details below for instant verification:
          </Text>
          
          <Text style={styles.fieldLabel}>Transaction Hash (TXID)</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste transaction hash here"
            value={txHash}
            onChangeText={setTxHash}
            autoCapitalize="none"
          />
          
          <Text style={styles.fieldLabel}>Amount Sent</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${selectedCrypto} amount`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          
          <TouchableOpacity 
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={handleDepositVerification}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Deposit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How It Works</Text>
          <Text style={styles.infoStep}>1. Copy the {selectedCrypto} address above</Text>
          <Text style={styles.infoStep}>2. Send crypto from your external wallet</Text>
          <Text style={styles.infoStep}>3. Copy the transaction hash from your wallet</Text>
          <Text style={styles.infoStep}>4. Paste it here for instant verification</Text>
          <Text style={styles.infoStep}>5. Your balance updates automatically</Text>
          
          <Text style={styles.infoNote}>
            🔒 Our system uses blockchain APIs to verify transactions in real-time, 
            preventing fake or duplicate deposits.
          </Text>
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
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  walletGrid: {
    marginBottom: 24,
  },
  walletCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedWallet: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  walletIcon: {
    marginRight: 16,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    flex: 1,
  },
  walletNetwork: {
    fontSize: 12,
    color: '#64748b',
    position: 'absolute',
    bottom: 20,
    left: 92,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  rocketIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    position: 'relative',
  },
  rocketBody: {
    width: 20,
    height: 32,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    position: 'absolute',
    left: 14,
    top: 8,
  },
  rocketTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#dc2626',
    position: 'absolute',
    left: 14,
    top: 0,
  },
  rocketFin1: {
    width: 8,
    height: 12,
    backgroundColor: '#64748b',
    borderRadius: 4,
    position: 'absolute',
    left: 8,
    bottom: 4,
  },
  rocketFin2: {
    width: 8,
    height: 12,
    backgroundColor: '#64748b',
    borderRadius: 4,
    position: 'absolute',
    right: 8,
    bottom: 4,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },

  addressContainer: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#1a365d',
    fontFamily: 'monospace',
    marginBottom: 12,
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
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
    marginBottom: 4,
  },
  verificationCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
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
  verifyButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 6,
  },
  infoNote: {
    fontSize: 12,
    color: '#166534',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});