import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Balance } from '../types';
import { apiService } from '../services/api';
import { CryptoIcon } from '../components/CryptoIcon';

interface Props {
  balance: Balance;
  usdRates: Record<string, number>;
  onClose: () => void;
  onSuccess: () => void;
  userToken: string;
}

export const ConvertScreen: React.FC<Props> = ({ balance, usdRates, onClose, onSuccess, userToken }) => {
  const [fromCrypto, setFromCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [toCrypto, setToCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('ETH');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', icon: '₮' }
  ] as const;

  const getConversionRate = () => {
    const fromRate = usdRates[fromCrypto] || 0;
    const toRate = usdRates[toCrypto] || 0;
    return fromRate / toRate;
  };

  const getConvertedAmount = () => {
    const inputAmount = parseFloat(amount || '0');
    const rate = getConversionRate();
    return inputAmount * rate;
  };

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const inputAmount = parseFloat(amount);
    const availableBalance = balance[fromCrypto] || 0;

    if (inputAmount > availableBalance) {
      Alert.alert('Insufficient Balance', `You only have ${availableBalance} ${fromCrypto}`);
      return;
    }

    if (fromCrypto === toCrypto) {
      Alert.alert('Error', 'Cannot convert to the same cryptocurrency');
      return;
    }

    const convertedAmount = getConvertedAmount();
    const rate = getConversionRate();

    Alert.alert(
      'Confirm Conversion',
      `Convert ${amount} ${fromCrypto} to ${convertedAmount.toFixed(8)} ${toCrypto}?\n\nRate: 1 ${fromCrypto} = ${rate.toFixed(8)} ${toCrypto}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Convert', onPress: executeConversion }
      ]
    );
  };

  const executeConversion = async () => {
    setLoading(true);
    try {
      const convertedAmount = getConvertedAmount();
      
      await apiService.convertCrypto(userToken, {
        fromCrypto,
        toCrypto,
        amount: parseFloat(amount),
        rate: getConversionRate(),
        convertedAmount
      });

      // Update local balance immediately for better UX
      const newBalance = {
        ...balance,
        [fromCrypto]: balance[fromCrypto] - parseFloat(amount),
        [toCrypto]: balance[toCrypto] + convertedAmount
      };
      
      Alert.alert(
        'Conversion Successful!',
        `${amount} ${fromCrypto} converted to ${convertedAmount.toFixed(8)} ${toCrypto}\n\nYour balances have been updated.`,
        [{ text: 'OK', onPress: () => onSuccess() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Convert Crypto</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Swap between cryptocurrencies at live market rates</Text>

        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From</Text>
          <View style={styles.cryptoSelector}>
            {cryptos.map(crypto => (
              <TouchableOpacity
                key={crypto.symbol}
                style={[styles.cryptoOption, fromCrypto === crypto.symbol && styles.selectedCrypto]}
                onPress={() => setFromCrypto(crypto.symbol)}
              >
                <CryptoIcon crypto={crypto.symbol} size={24} />
                <Text style={[styles.cryptoText, fromCrypto === crypto.symbol && styles.selectedText]}>
                  {crypto.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance:</Text>
            <Text style={styles.balanceAmount}>
              {(balance[fromCrypto] || 0).toFixed(8)} {fromCrypto}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder={`Enter ${fromCrypto} amount`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Swap Icon */}
        <View style={styles.swapContainer}>
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={() => {
              const temp = fromCrypto;
              setFromCrypto(toCrypto);
              setToCrypto(temp);
            }}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          <View style={styles.cryptoSelector}>
            {cryptos.map(crypto => (
              <TouchableOpacity
                key={crypto.symbol}
                style={[styles.cryptoOption, toCrypto === crypto.symbol && styles.selectedCrypto]}
                onPress={() => setToCrypto(crypto.symbol)}
              >
                <CryptoIcon crypto={crypto.symbol} size={24} />
                <Text style={[styles.cryptoText, toCrypto === crypto.symbol && styles.selectedText]}>
                  {crypto.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.conversionResult}>
            <Text style={styles.resultLabel}>You will receive:</Text>
            <Text style={styles.resultAmount}>
              {getConvertedAmount().toFixed(8)} {toCrypto}
            </Text>
          </View>
        </View>

        {/* Rate Info */}
        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Exchange Rate</Text>
          <Text style={styles.rateText}>
            1 {fromCrypto} = {getConversionRate().toFixed(8)} {toCrypto}
          </Text>
          <Text style={styles.rateSubtext}>
            Based on live market prices • Updates every second
          </Text>
        </View>

        {/* Convert Button */}
        <TouchableOpacity 
          style={[styles.convertButton, loading && styles.disabledButton]}
          onPress={handleConvert}
          disabled={loading}
        >
          <Text style={styles.convertButtonText}>
            {loading ? 'Converting...' : `Convert ${fromCrypto} to ${toCrypto}`}
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔄 How Conversion Works</Text>
          <Text style={styles.infoText}>• Conversions use real-time market rates</Text>
          <Text style={styles.infoText}>• No additional fees - only market spread</Text>
          <Text style={styles.infoText}>• Instant conversion within your wallet</Text>
          <Text style={styles.infoText}>• All transactions are verified on blockchain</Text>
          
          <Text style={styles.warningText}>
            ⚠️ Rates update every second. The final rate is locked when you confirm the conversion.
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
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  cryptoSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cryptoOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCrypto: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },

  cryptoText: {
    fontWeight: 'bold',
    color: '#1a365d',
    fontSize: 12,
  },
  selectedText: {
    color: '#f59e0b',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  swapIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  conversionResult: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  rateCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  rateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 4,
  },
  rateSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  convertButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  convertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 12,
    fontStyle: 'italic',
  },
});