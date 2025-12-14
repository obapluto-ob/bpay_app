import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';

interface Props {
  userCountry: 'NG' | 'KE';
  userBalance: { kes: number; ngn: number };
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawScreen: React.FC<Props> = ({ userCountry, userBalance, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });
  const [selectedMethod, setSelectedMethod] = useState<'sasapay' | 'bank' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currency = userCountry === 'NG' ? '₦' : 'KSh';
  const currencyName = userCountry === 'NG' ? 'Naira' : 'Shillings';
  const balance = userCountry === 'NG' ? userBalance.ngn : userBalance.kes;

  const handleSasaPayWithdraw = async () => {
    if (!amount || !phoneNumber) {
      Alert.alert('Error', 'Please enter amount and phone number');
      return;
    }

    if (parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum withdrawal is KSh 100');
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/sasapay/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current_user_id', // Replace with actual user ID
          amount: parseFloat(amount),
          phoneNumber: phoneNumber
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Withdrawal Initiated!',
          'Your withdrawal is being processed. Funds will be sent to your M-Pesa within 5 minutes.',
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

  const handleBankWithdraw = () => {
    if (!amount || !bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    Alert.alert(
      'Withdrawal Submitted',
      `Your withdrawal of ${currency}${amount} has been submitted. Admin will process within 24 hours.`,
      [{ text: 'OK', onPress: onSuccess }]
    );
  };

  if (!selectedMethod) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Withdraw {currencyName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{currency}{balance.toFixed(2)}</Text>
          </View>

          <Text style={styles.subtitle}>Choose withdrawal method:</Text>
          
          {userCountry === 'KE' && (
            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => setSelectedMethod('sasapay')}
            >
              <View style={[styles.methodIcon, styles.automatedIcon]}>
                <View style={styles.lightningBolt} />
                <View style={styles.phoneBody} />
                <View style={styles.phoneScreen} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>SasaPay (Instant)</Text>
                <Text style={styles.methodDetails}>Instant M-Pesa withdrawal</Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setSelectedMethod('bank')}
          >
            <View style={[styles.methodIcon, styles.bankIcon]}>
              <View style={styles.bankIconContainer}>
                <View style={styles.bankBuilding} />
                <View style={styles.bankPillar1} />
                <View style={styles.bankPillar2} />
                <View style={styles.bankPillar3} />
                <View style={styles.bankRoof} />
              </View>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Transfer</Text>
              <Text style={styles.methodDetails}>Transfer to your bank account</Text>
            </View>
            <Text style={styles.methodArrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedMethod === 'sasapay' ? 'SasaPay Withdrawal' : 'Bank Withdrawal'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{currency}{balance.toFixed(2)}</Text>
        </View>

        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawTitle}>
            {selectedMethod === 'sasapay' ? 'Instant M-Pesa Withdrawal' : 'Bank Transfer Withdrawal'}
          </Text>
          
          <Text style={styles.fieldLabel}>Amount to Withdraw</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter amount in ${currencyName}`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {selectedMethod === 'sasapay' ? (
            <>
              <Text style={styles.fieldLabel}>M-Pesa Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="254712345678"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              
              <TouchableOpacity 
                style={[styles.withdrawButton, isProcessing && styles.disabledButton]}
                onPress={handleSasaPayWithdraw}
                disabled={isProcessing}
              >
                <Text style={styles.withdrawButtonText}>
                  {isProcessing ? 'Processing...' : 'Withdraw to M-Pesa'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                value={bankDetails.accountNumber}
                onChangeText={(text) => setBankDetails({...bankDetails, accountNumber: text})}
              />

              <Text style={styles.fieldLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                value={bankDetails.bankName}
                onChangeText={(text) => setBankDetails({...bankDetails, bankName: text})}
              />

              <Text style={styles.fieldLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account holder name"
                value={bankDetails.accountName}
                onChangeText={(text) => setBankDetails({...bankDetails, accountName: text})}
              />
              
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={handleBankWithdraw}
              >
                <Text style={styles.withdrawButtonText}>Submit Withdrawal Request</Text>
              </TouchableOpacity>
            </>
          )}
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#64748b',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  bankIcon: {
    backgroundColor: '#dbeafe',
  },
  automatedIcon: {
    backgroundColor: '#fef3c7',
  },
  bankIconContainer: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  bankBuilding: {
    width: 20,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 4,
  },
  bankPillar1: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    left: 6,
  },
  bankPillar2: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    left: 12,
  },
  bankPillar3: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  bankRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1e40af',
    position: 'absolute',
    top: 0,
    left: -4,
  },
  lightningBolt: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#f59e0b',
    position: 'absolute',
    top: 2,
    left: 8,
    transform: [{ rotate: '15deg' }],
  },
  phoneBody: {
    width: 16,
    height: 24,
    backgroundColor: '#16a34a',
    borderRadius: 4,
    position: 'absolute',
    left: 4,
    top: 2,
  },
  phoneScreen: {
    width: 12,
    height: 16,
    backgroundColor: '#22c55e',
    borderRadius: 2,
    position: 'absolute',
    left: 6,
    top: 4,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  methodArrow: {
    fontSize: 20,
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
  withdrawButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
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