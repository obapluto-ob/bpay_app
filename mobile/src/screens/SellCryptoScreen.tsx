import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { apiService } from '../services/api';
import { BankDetails, CryptoRate } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PaymentIcon } from '../components/PaymentIcon';
import { TradeChatScreen } from './TradeChatScreen';

interface Props {
  rates: Record<string, CryptoRate>;
  usdRates: Record<string, number>;
  exchangeRates: { USDNGN: number; USDKES: number };
  token: string;
  userCountry: 'NG' | 'KE';
  onClose: () => void;
  onSuccess: () => void;
  onLockRate: (crypto: string, type: 'sell') => number;
  userBalance: { BTC: number; ETH: number; USDT: number };
  onNotification: (message: string, type: 'success' | 'warning' | 'info') => void;
  onOpenChat?: (trade: any) => void;
}

export const SellCryptoScreen: React.FC<Props> = ({ rates, usdRates, exchangeRates, token, userCountry, onClose, onSuccess, onLockRate, userBalance, onNotification }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountName: '',
    accountNumber: '',
    bankName: '',
    country: userCountry,
  });
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'mobile'>('bank');
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'KES'>(userCountry === 'NG' ? 'NGN' : 'KES');
  const [loading, setLoading] = useState(false);
  const [lockedRate, setLockedRate] = useState<number | null>(null);
  const [rateLockedAt, setRateLockedAt] = useState<Date | null>(null);
  const [orderStep, setOrderStep] = useState<'create' | 'escrow' | 'transfer' | 'waiting'>('create');
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [assignedAdmin, setAssignedAdmin] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<any>(null);
  
  // Admin assignment logic for sell orders
  const getBestAvailableAdmin = async () => {
    try {
      const response = await fetch('https://bpay-app.onrender.com/api/admin/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const admins = data.admins || [];
        
        // Filter by region and sort by performance
        const availableAdmins = admins
          .filter((admin: any) => admin.region === selectedCurrency.slice(0, 2) || admin.region === 'ALL')
          .sort((a: any, b: any) => {
            if (b.averageRating !== a.averageRating) {
              return b.averageRating - a.averageRating;
            }
            if (a.responseTime !== b.responseTime) {
              return a.responseTime - b.responseTime;
            }
            return a.currentLoad - b.currentLoad;
          });
          
        return availableAdmins[0];
      }
    } catch (error) {
      console.log('Failed to fetch admins:', error);
    }
    
    // Fallback admin
    return {
      id: 'verification_admin',
      name: 'Verification Admin',
      email: 'verify@bpay.com',
      averageRating: 4.9,
      responseTime: 6
    };
  };
  
  const getAssignedAdmin = () => {
    return assignedAdmin || getBestAvailableAdmin();
  };
  
  const [companyAddress, setCompanyAddress] = useState<string>('');
  
  // Get Luno deposit address for selected crypto
  const getDepositAddress = async () => {
    try {
      const response = await fetch('/api/luno/deposit/address', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 'current_user_id', // Replace with actual user ID
          currency: selectedCrypto
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setCompanyAddress(result.address);
      }
    } catch (error) {
      console.error('Failed to get deposit address:', error);
    }
  };

  const handleCreateEscrow = async () => {
    if (!amount || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const cryptoAmount = parseFloat(amount);
    const availableBalance = userBalance[selectedCrypto] || 0;
    
    // Amount validation
    if (cryptoAmount < minSellLimits[selectedCrypto]) {
      Alert.alert(
        'Minimum Amount',
        `Minimum sell amount is ${minSellLimits[selectedCrypto]} ${selectedCrypto}`
      );
      return;
    }
    
    const maxAllowed = getMaxSellAmount();
    if (cryptoAmount > maxAllowed) {
      if (paymentMethod === 'mobile') {
        Alert.alert(
          'Mobile Payment Limit',
          `Maximum ${selectedCurrency} ${maxFiatForMobile.toLocaleString()} (${maxAllowed.toFixed(8)} ${selectedCrypto}) for mobile payments`
        );
      } else {
        const bankLimits = { BTC: 50000, ETH: 30000, USDT: 100000 }; // USD limits same as buy
        Alert.alert(
          'Maximum Amount',
          `Maximum sell amount is $${bankLimits[selectedCrypto].toLocaleString()} USD worth per transaction`
        );
      }
      return;
    }
    
    // Balance validation
    if (availableBalance === 0) {
      Alert.alert('No Balance', `You don't have any ${selectedCrypto} to sell.`);
      return;
    }
    
    if (cryptoAmount > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${cryptoAmount} ${selectedCrypto} but only have ${availableBalance.toFixed(8)} ${selectedCrypto}.`
      );
      return;
    }

    // Lock rate when user creates escrow
    if (!lockedRate) {
      const rate = onLockRate(selectedCrypto, 'sell');
      setLockedRate(rate);
      setRateLockedAt(new Date());
    }

    setLoading(true);
    try {
      // Create trade via API
      const tradeData = {
        type: 'sell' as const,
        crypto: selectedCrypto,
        cryptoAmount,
        fiatAmount,
        paymentMethod,
        country: selectedCurrency === 'NGN' ? 'NG' : 'KE',
        bankDetails
      };
      
      const response = await apiService.createTrade(tradeData, token);
      const trade = response.trade;
      
      // Get assigned admin
      const bestAdmin = await getBestAvailableAdmin();
      setAssignedAdmin(bestAdmin);

      setEscrowId(trade.id);
      setOrderStep('escrow');
      
      onNotification(
        `Sell order created: ${cryptoAmount} ${selectedCrypto} for ${userCountry === 'NG' ? 'NGN' : 'KES'} ${fiatAmount.toLocaleString()}`,
        'success'
      );
      
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onNotification('Sell order expired - order automatically cancelled', 'warning');
            setOrderStep('create');
            return 900;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create escrow order');
    } finally {
      setLoading(false);
    }
  };

  // Sell rates with profit margin (app buys at lower rate)
  const baseRate = (usdRates[selectedCrypto] || 0) * (selectedCurrency === 'NGN' ? exchangeRates.USDNGN : exchangeRates.USDKES);
  const sellMargin = 0.02; // 2% margin for app profit
  const realRate = Math.round(baseRate * (1 - sellMargin));
  const currentRate = lockedRate || realRate;
  const fiatAmount = parseFloat(amount || '0') * currentRate;
  
  // Minimum sell limits - matching buy crypto for consistency
  const minSellLimits = {
    BTC: 0.0001,  // ~$10 minimum (same as buy)
    ETH: 0.002,   // ~$5 minimum (same as buy)
    USDT: 1       // $1 minimum (same as buy)
  };
  
  // Mobile payment limits - both equivalent to 250k KES
  const mobileLimits = {
    NGN: 3250000, // ~250k KES equivalent (1 KES ≈ 13 NGN)
    KES: 250000   // Kenya M-Pesa 500k but we use half for safety
  };
  const maxFiatForMobile = mobileLimits[selectedCurrency];
  
  const getMaxSellAmount = () => {
    if (paymentMethod === 'mobile') {
      return Math.min(maxFiatForMobile / currentRate, userBalance[selectedCrypto] || 0);
    }
    // Bank transfers have higher limits (USD equivalent)
    const bankLimitsUSD = { BTC: 50000, ETH: 30000, USDT: 100000 };
    const maxCryptoFromUSD = bankLimitsUSD[selectedCrypto] / (usdRates[selectedCrypto] || 1);
    return Math.min(maxCryptoFromUSD, userBalance[selectedCrypto] || 0);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => {
          console.log('Close button pressed');
          onClose();
        }} 
        style={styles.closeButtonContainer}
        activeOpacity={0.5}
      >
        <Text style={styles.closeButton}>✕</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Sell Crypto</Text>
        </View>

      <View style={styles.cryptoSelector}>
        {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
          <TouchableOpacity
            key={crypto}
            style={[styles.cryptoOption, selectedCrypto === crypto && styles.selectedCrypto]}
            onPress={() => setSelectedCrypto(crypto)}
          >
            <View style={styles.cryptoContent}>
              <CryptoIcon crypto={crypto} size={24} />
              <Text style={[styles.cryptoText, selectedCrypto === crypto && styles.selectedText]}>
                {crypto}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.rateText}>
        {lockedRate ? (
          <>
            🔒 Locked Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{lockedRate.toLocaleString()} per {selectedCrypto}
            {rateLockedAt && (
              <Text style={styles.lockTime}>
                \n(Locked at {rateLockedAt.toLocaleTimeString()})
              </Text>
            )}
          </>
        ) : (
          <>Sell Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{realRate.toLocaleString()} per {selectedCrypto}</>
        )}
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.inputWithButton]}
          placeholder={`${selectedCrypto} amount to sell`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TouchableOpacity 
          style={styles.maxButton}
          onPress={() => {
            const maxAmount = userBalance[selectedCrypto] || 0;
            if (maxAmount === 0) {
              Alert.alert('Insufficient Balance', `You don't have any ${selectedCrypto} to sell`);
              return;
            }
            setAmount(maxAmount.toString());
          }}
        >
          <Text style={styles.maxButtonText}>MAX</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.limitsText}>
        Min: {minSellLimits[selectedCrypto]} {selectedCrypto} | Max: {getMaxSellAmount().toFixed(8)} {selectedCrypto}
      </Text>

      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Available Balance:</Text>
        <Text style={styles.balanceAmount}>
          {(userBalance[selectedCrypto] || 0).toFixed(8)} {selectedCrypto}
        </Text>
      </View>

      {amount && parseFloat(amount) > 0 && (userBalance[selectedCrypto] || 0) > 0 && (
        <Text style={styles.preview}>
          You'll receive: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{fiatAmount.toLocaleString()}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Select Currency</Text>
      
      <View style={styles.currencySelector}>
        <TouchableOpacity
          style={[styles.currencyOption, selectedCurrency === 'NGN' && styles.selectedCurrency]}
          onPress={() => setSelectedCurrency('NGN')}
        >
          <Text style={styles.flagEmoji}>🇳🇬</Text>
          <Text style={[styles.currencyText, selectedCurrency === 'NGN' && styles.selectedText]}>Nigerian Naira (NGN)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.currencyOption, selectedCurrency === 'KES' && styles.selectedCurrency]}
          onPress={() => setSelectedCurrency('KES')}
        >
          <Text style={styles.flagEmoji}>🇰🇪</Text>
          <Text style={[styles.currencyText, selectedCurrency === 'KES' && styles.selectedText]}>Kenyan Shilling (KES)</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      <View style={styles.paymentMethodSelector}>
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'bank' && styles.selectedPayment]}
          onPress={() => setPaymentMethod('bank')}
        >
          <Text style={[styles.paymentText, paymentMethod === 'bank' && styles.selectedText]}>Bank Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'mobile' && styles.selectedPayment]}
          onPress={() => setPaymentMethod('mobile')}
        >
          <Text style={[styles.paymentText, paymentMethod === 'mobile' && styles.selectedText]}>
            {selectedCurrency === 'NGN' ? 'Mobile Wallet' : 'Mobile Money'} (Max: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{maxFiatForMobile.toLocaleString()})
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>
        {paymentMethod === 'bank' ? 'Bank Details' : (userCountry === 'NG' ? 'Mobile Wallet Details' : 'Mobile Money Details')}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder={paymentMethod === 'bank' ? 'Account Name' : 'Full Name'}
        value={bankDetails.accountName}
        onChangeText={(text) => setBankDetails(prev => ({ ...prev, accountName: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder={paymentMethod === 'bank' ? 'Account Number' : 'Phone Number'}
        value={bankDetails.accountNumber}
        onChangeText={(text) => setBankDetails(prev => ({ ...prev, accountNumber: text }))}
        keyboardType="numeric"
      />

      {paymentMethod === 'bank' ? (
        <TextInput
          style={styles.input}
          placeholder={selectedCurrency === 'NGN' ? 'Bank Name (e.g., GTBank, Access Bank)' : 'Bank Name'}
          value={bankDetails.bankName}
          onChangeText={(text) => setBankDetails(prev => ({ ...prev, bankName: text }))}
        />
      ) : (
        <View style={styles.walletSelector}>
          <Text style={styles.walletLabel}>Select {selectedCurrency === 'NGN' ? 'Mobile Wallet' : 'Mobile Money Provider'}:</Text>
          <View style={styles.walletOptions}>
            {selectedCurrency === 'NGN' ? (
              ['OPay', 'PalmPay', 'Kuda', 'Moniepoint'].map(wallet => (
                <TouchableOpacity
                  key={wallet}
                  style={[styles.walletOption, bankDetails.bankName === wallet && styles.selectedWallet]}
                  onPress={() => setBankDetails(prev => ({ ...prev, bankName: wallet }))}
                >
                  <View style={styles.walletContent}>
                    <PaymentIcon provider={wallet} size={20} />
                    <Text style={[styles.walletText, bankDetails.bankName === wallet && styles.selectedWalletText]}>
                      {wallet}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              ['M-Pesa', 'Airtel Money', 'T-Kash'].map(provider => (
                <TouchableOpacity
                  key={provider}
                  style={[styles.walletOption, bankDetails.bankName === provider && styles.selectedWallet]}
                  onPress={() => setBankDetails(prev => ({ ...prev, bankName: provider }))}
                >
                  <View style={styles.walletContent}>
                    <PaymentIcon provider={provider} size={20} />
                    <Text style={[styles.walletText, bankDetails.bankName === provider && styles.selectedWalletText]}>
                      {provider}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}

      {orderStep === 'create' && (
        <TouchableOpacity
          style={[styles.sellButton, loading && styles.disabledButton]}
          onPress={handleCreateEscrow}
          disabled={loading}
        >
          <Text style={styles.sellButtonText}>
            {loading ? 'Creating Order...' : 'Lock Order & Proceed'}
          </Text>
        </TouchableOpacity>
      )}
      
      {orderStep === 'escrow' && (
        <View style={styles.escrowSection}>
          <View style={styles.escrowHeader}>
            <Text style={styles.escrowTitle}>Order Created Successfully</Text>
            <Text style={styles.escrowTimer}>
              Complete transfer within: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          <View style={styles.escrowDetails}>
            <Text style={styles.escrowLabel}>Order ID:</Text>
            <Text style={styles.escrowValue}>#{escrowId}</Text>
            
            <Text style={styles.escrowLabel}>Crypto Amount:</Text>
            <Text style={styles.escrowValue}>{parseFloat(amount).toFixed(8)} {selectedCrypto}</Text>
            
            <Text style={styles.escrowLabel}>You will receive:</Text>
            <Text style={styles.escrowValue}>
              {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{fiatAmount.toLocaleString()} ({selectedCurrency})
            </Text>
            
            <Text style={styles.escrowLabel}>Currency:</Text>
            <Text style={styles.escrowValue}>{selectedCurrency === 'NGN' ? 'Nigerian Naira' : 'Kenyan Shilling'}</Text>
            
            <Text style={styles.escrowLabel}>Payment Method:</Text>
            <Text style={styles.escrowValue}>
              {paymentMethod === 'bank' ? 'Bank Account' : (selectedCurrency === 'NGN' ? 'Mobile Wallet' : 'Mobile Money')} - {bankDetails.bankName}
            </Text>
            
            <Text style={styles.escrowLabel}>Status:</Text>
            <Text style={styles.escrowValue}>Awaiting Transfer</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.proceedButton}
            onPress={() => setOrderStep('transfer')}
          >
            <Text style={styles.proceedButtonText}>Proceed to Transfer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {orderStep === 'transfer' && (
        <View style={styles.transferSection}>
          <Text style={styles.transferTitle}>Send Your Crypto</Text>
          
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Send {selectedCrypto} to our Luno wallet:</Text>
            <View style={styles.walletAddress}>
              <Text style={styles.addressText}>
                {companyAddress || 'Loading address...'}
              </Text>
            </View>
            
            <Text style={styles.walletWarning}>
              IMPORTANT: Only send {selectedCrypto} to this address.
              Sending other coins will result in permanent loss.
              Deposits are automatically credited via Luno.
            </Text>
            
            {!companyAddress && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={getDepositAddress}
              >
                <Text style={styles.refreshButtonText}>Get Deposit Address</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.sentButton}
            onPress={() => {
              setOrderStep('waiting');
              onNotification(
                `Transfer initiated for ${parseFloat(amount).toFixed(8)} ${selectedCrypto} - Luno will auto-detect deposit`,
                'info'
              );
            }}
          >
            <Text style={styles.sentButtonText}>I Have Sent the Crypto</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {orderStep === 'waiting' && (
        <View style={styles.waitingSection}>
          <Text style={styles.waitingTitle}>Transfer Verification</Text>
          <Text style={styles.waitingText}>
            Your crypto transfer will be automatically detected by Luno.
            Chat with admin if you need assistance or have issues.
          </Text>
          
          <View style={styles.adminAssigned}>
            <Text style={styles.adminLabel}>Assigned Admin:</Text>
            <Text style={styles.adminName}>{getAssignedAdmin().name}</Text>
            <Text style={styles.adminRating}>⭐ {getAssignedAdmin().averageRating.toFixed(1)} rating • Avg response: {getAssignedAdmin().responseTime} min</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => {
              // Navigate to chat screen with trade data
              const admin = getAssignedAdmin();
              const tradeData = {
                id: escrowId,
                type: 'sell',
                crypto: selectedCrypto,
                amount: parseFloat(amount),
                fiatAmount,
                currency: selectedCurrency,
                status: 'processing',
                assignedAdmin: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                adminRating: admin.averageRating,
                chatMessages: [
                  {
                    id: 'msg_1',
                    senderId: 'system',
                    senderName: 'System',
                    senderType: 'admin',
                    message: `Sell order created: ${parseFloat(amount).toFixed(8)} ${selectedCrypto} for ${selectedCurrency} ${fiatAmount.toLocaleString()}. ${admin.name} will verify your transfer shortly.`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                  }
                ]
              };
              
              // Save trade data
              const savedTrade = {
                ...tradeData,
                createdAt: new Date().toISOString()
              };
              
              // Trade is already saved via API
              
              // Open chat screen
              setCurrentTrade(tradeData);
              setShowChat(true);
              
              onNotification(
                `💬 Chat opened with ${admin.name} - communicate about your transfer verification`,
                'info'
              );
            }}
          >
            <Text style={styles.chatButtonText}>💬 Chat with Admin</Text>
          </TouchableOpacity>
          
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Verifying Transfer...</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Cancel Order',
                'Are you sure you want to cancel this order? You can raise a dispute if there are issues.',
                [
                  { text: 'Raise Dispute', onPress: () => {
                    Alert.alert('Dispute', 'Dispute feature will be available in chat with admin.');
                  }},
                  { text: 'Cancel Order', style: 'destructive', onPress: () => {
                    setOrderStep('create');
                    onNotification('Sell order cancelled', 'warning');
                  }},
                  { text: 'Keep Order', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {orderStep === 'create' && (
        <Text style={styles.disclaimer}>
          Your crypto will be held in escrow until payment is processed.
          Funds are released to your bank account within 1-24 hours.
        </Text>
      )}
      </ScrollView>
      
      {/* Chat Modal */}
      {showChat && currentTrade && (
        <TradeChatScreen
          trade={currentTrade}
          userToken={token}
          onClose={() => {
            setShowChat(false);
            setCurrentTrade(null);
          }}
          onRateAdmin={(rating) => {
            onNotification(`⭐ Rated admin ${rating} stars - thank you for your feedback!`, 'success');
          }}
          onRaiseDispute={(reason) => {
            onNotification(`⚠️ Dispute raised: ${reason} - admin will review shortly`, 'warning');
          }}
          onTradeComplete={(status, message) => {
            // Auto-close chat and show completion message
            setShowChat(false);
            setCurrentTrade(null);
            
            if (status === 'approved') {
              onNotification(`🎉 ${message} - Your payment is being processed!`, 'success');
              onSuccess(); // Close sell screen and refresh balance
            } else {
              onNotification(`❌ ${message} - Please contact support if needed`, 'warning');
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 80,
    padding: 20,
    paddingTop: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#f59e0b',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  closeButton: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedCrypto: {
    backgroundColor: '#f59e0b',
  },
  cryptoContent: {
    alignItems: 'center',
    gap: 8,
  },
  cryptoText: {
    fontWeight: 'bold',
    color: '#1a365d',
  },
  selectedText: {
    color: 'white',
  },
  rateText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  preview: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 15,
  },
  sellButton: {
    backgroundColor: '#ef4444',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sellButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },
  lockTime: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
  },
  escrowSection: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  escrowHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  escrowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  escrowTimer: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  escrowDetails: {
    marginBottom: 20,
  },
  escrowLabel: {
    fontSize: 14,
    color: '#166534',
    marginTop: 8,
  },
  escrowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  proceedButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferSection: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  transferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletInfo: {
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  walletAddress: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#1a365d',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  walletWarning: {
    fontSize: 12,
    color: '#92400e',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sentButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingSection: {
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayment: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  paymentText: {
    fontWeight: 'bold',
    color: '#1a365d',
  },
  selectedText: {
    color: 'white',
  },
  walletSelector: {
    marginBottom: 15,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  walletOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  currencySelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  currencyOption: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  flagEmoji: {
    fontSize: 20,
  },
  selectedCurrency: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  currencyText: {
    fontWeight: 'bold',
    color: '#1a365d',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedWallet: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  selectedWalletText: {
    color: 'white',
  },
  limitsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
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
    paddingVertical: 15,
    borderRadius: 8,
  },
  maxButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminAssigned: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  adminLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  adminRating: {
    fontSize: 12,
    color: '#64748b',
  },
  chatButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});