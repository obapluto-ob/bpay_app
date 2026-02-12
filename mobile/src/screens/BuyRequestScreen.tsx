import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Image } from 'react-native';
import { apiService } from '../services/api';
import { CryptoRate } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { storage } from '../utils/storage';
import { TradeChatScreen } from './TradeChatScreen';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  rates: Record<string, CryptoRate>;
  usdRates: Record<string, number>;
  exchangeRates: { USDNGN: number; USDKES: number };
  token: string;
  userCountry: 'NG' | 'KE';
  onClose: () => void;
  onSuccess: () => void;
  onLockRate: (crypto: string, type: 'buy') => number;
  userBalance: { NGN: number; KES: number };
  onNotification: (message: string, type: 'success' | 'warning' | 'info') => void;
  onOpenChat?: (trade: any) => void;
}

export const BuyRequestScreen: React.FC<Props> = ({ rates, usdRates, exchangeRates, token, userCountry, onClose, onSuccess, onLockRate, userBalance, onNotification }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [fiatAmount, setFiatAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedRate, setLockedRate] = useState<number | null>(null);
  const [rateLockedAt, setRateLockedAt] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'bank'>('balance');
  const [orderStep, setOrderStep] = useState<'create' | 'escrow' | 'payment' | 'waiting'>('create');
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<any>(null);
  
  // Admin assignment logic
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
          .filter((admin: any) => admin.region === userCountry || admin.region === 'ALL')
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
      id: 'system_admin',
      name: 'System Admin',
      email: 'admin@bpay.com',
      averageRating: 4.5,
      responseTime: 10
    };
  };
  
  const getAssignedAdmin = () => {
    return assignedAdmin || getBestAvailableAdmin();
  };
  
  const getAssignedAdminName = () => {
    const admin = getAssignedAdmin();
    return admin.name || 'System Admin';
  };
  
  const getAssignedAdminRating = () => {
    const admin = getAssignedAdmin();
    return (admin.averageRating || 4.5).toFixed(1);
  };
  
  const getAssignedAdminResponseTime = () => {
    const admin = getAssignedAdmin();
    return admin.responseTime || 8;
  };
  
  // Check for existing active order on component mount
  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const savedOrder = await storage.getItem('activeBuyOrder');
        if (savedOrder) {
          const order = JSON.parse(savedOrder);
          const timeElapsed = Math.floor((Date.now() - order.createdAt) / 1000);
          const remaining = 900 - timeElapsed;
          
          if (remaining > 0) {
            // Restore active order
            setActiveOrderId(order.id);
            setEscrowId(order.id);
            setSelectedCrypto(order.crypto);
            setFiatAmount(order.fiatAmount.toString());
            setPaymentMethod(order.paymentMethod);
            setOrderStep(order.step);
            setTimeRemaining(remaining);
            
            // Resume timer
            const timer = setInterval(() => {
              setTimeRemaining(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  cancelOrder();
                  return 900;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            // Order expired, clean up
            await storage.removeItem('activeBuyOrder');
          }
        }
      } catch (error) {
        console.log('No active order found');
      }
    };
    
    checkActiveOrder();
  }, []);

  const handleCreateEscrow = async () => {
    if (!fiatAmount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    const amount = parseFloat(fiatAmount);
    const availableBalance = userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0;
    
    // Define limits based on crypto and country
    const limits = {
      BTC: {
        minUSD: 10, // $10 minimum
        maxUSD: 50000 // $50k maximum
      },
      ETH: {
        minUSD: 5, // $5 minimum
        maxUSD: 30000 // $30k maximum
      },
      USDT: {
        minUSD: 1, // $1 minimum as specified
        maxUSD: 100000 // $100k maximum
      }
    };
    
    const exchangeRate = userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES;
    const minAmount = limits[selectedCrypto].minUSD * exchangeRate;
    const maxAmount = limits[selectedCrypto].maxUSD * exchangeRate;
    
    // Check minimum amount
    if (amount < minAmount) {
      Alert.alert(
        'Amount Too Small',
        `Minimum ${selectedCrypto} purchase is ${userCountry === 'NG' ? '₦' : 'KSh'}${minAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${limits[selectedCrypto].minUSD} USD) to cover network fees.`
      );
      return;
    }
    
    // Check maximum amount
    if (amount > maxAmount) {
      Alert.alert(
        'Amount Too Large',
        `Maximum ${selectedCrypto} purchase is ${userCountry === 'NG' ? '₦' : 'KSh'}${maxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${limits[selectedCrypto].maxUSD.toLocaleString()} USD) per transaction.`
      );
      return;
    }

    // Check for wallet payment method validations
    if (paymentMethod === 'balance') {
      if (availableBalance === 0) {
        Alert.alert(
          'Empty Wallet', 
          `Your ${userCountry === 'NG' ? 'NGN' : 'KES'} wallet is empty. Please deposit funds first or use Bank Transfer.`,
          [
            { text: 'Use Bank Transfer', onPress: () => setPaymentMethod('bank') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      
      if (amount > availableBalance) {
        Alert.alert(
          'Insufficient Funds',
          `You need ${userCountry === 'NG' ? '₦' : 'KSh'}${amount.toLocaleString()} but only have ${userCountry === 'NG' ? '₦' : 'KSh'}${availableBalance.toLocaleString()}.`,
          [
            { text: 'Use Bank Transfer', onPress: () => setPaymentMethod('bank') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
    }

    // Lock rate when user clicks buy
    if (!lockedRate) {
      const rate = onLockRate(selectedCrypto, 'buy');
      setLockedRate(rate);
      setRateLockedAt(new Date());
    }

    setLoading(true);
    try {
      // Calculate rates and amounts
      const liveRate = (usdRates[selectedCrypto] || 0) * (userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES);
      const finalRate = lockedRate || liveRate;
      const cryptoAmountCalculated = amount / (finalRate || 1);
      
      // Create trade via API
      const tradeData = {
        type: 'buy' as const,
        crypto: selectedCrypto,
        fiatAmount: amount,
        cryptoAmount: cryptoAmountCalculated,
        paymentMethod,
        country: userCountry
      };
      
      const response = await apiService.createTrade(tradeData, token);
      
      if (!response || !response.trade) {
        throw new Error('Invalid response from server');
      }
      
      const trade = response.trade;
      
      // Get assigned admin (or schedule if none available)
      const bestAdmin = await getBestAvailableAdmin();
      setAssignedAdmin(bestAdmin);

      setEscrowId(trade.id);
      setActiveOrderId(trade.id);
      
      // Save order to storage
      const orderData = {
        id: trade.id,
        crypto: selectedCrypto,
        fiatAmount: amount,
        cryptoAmount: cryptoAmountCalculated,
        paymentMethod,
        country: userCountry,
        step: 'waiting',
        createdAt: Date.now()
      };
      await storage.setItem('activeBuyOrder', JSON.stringify(orderData));
      
      // Send first message to admin
      const firstMessage = `New ${selectedCrypto} buy order created\n\nOrder ID: #${trade.id}\nAmount: ${cryptoAmountCalculated.toFixed(8)} ${selectedCrypto}\nFiat: ${userCountry === 'NG' ? '₦' : 'KSh'}${amount.toLocaleString()}\nPayment Method: ${paymentMethod === 'balance' ? 'Wallet Balance' : (userCountry === 'NG' ? 'Bank Transfer' : 'M-Pesa')}\nCountry: ${userCountry === 'NG' ? 'Nigeria' : 'Kenya'}\n\nWaiting for payment details...`;
      
      await fetch(`https://bpay-app.onrender.com/api/trade/${trade.id}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: firstMessage, type: 'text' })
      });
      
      // Auto-redirect to chat
      const tradeData = {
        id: trade.id,
        type: 'buy',
        crypto: selectedCrypto,
        amount: cryptoAmountCalculated,
        fiatAmount: amount,
        currency: userCountry === 'NG' ? 'NGN' : 'KES',
        status: 'pending',
        assignedAdmin: bestAdmin.id,
        adminName: bestAdmin.name,
        adminEmail: bestAdmin.email,
        adminRating: bestAdmin.averageRating,
        paymentMethod,
        chatMessages: []
      };
      
      setCurrentTrade(tradeData);
      setOrderStep('waiting');
      setShowChat(true);
      
      onNotification(
        `Order created - Chat opened with ${bestAdmin.name}`,
        'success'
      );
      
    } catch (error) {
      console.error('Trade creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to create order: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    try {
      await storage.removeItem('activeBuyOrder');
      setOrderStep('create');
      setActiveOrderId(null);
      setEscrowId(null);
      setTimeRemaining(900);
      Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
      onNotification('Buy order cancelled', 'warning');
    } catch (error) {
      console.log('Error cancelling order');
    }
  };
  
  const selectPaymentProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload payment proof.');
        return;
      }

      setUploadingProof(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentProof(result.assets[0].uri);
        onNotification('Payment proof selected successfully', 'success');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploadingProof(false);
    }
  };

  const updateOrderStep = async (newStep: 'create' | 'escrow' | 'payment' | 'waiting') => {
    setOrderStep(newStep);
    
    if (activeOrderId && newStep !== 'create') {
      try {
        const savedOrder = await storage.getItem('activeBuyOrder');
        if (savedOrder) {
          const order = JSON.parse(savedOrder);
          order.step = newStep;
          if (paymentProof) order.paymentProof = paymentProof;
          await storage.setItem('activeBuyOrder', JSON.stringify(order));
        }
      } catch (error) {
        console.log('Error updating order step');
      }
    }
  };

  const liveRate = (usdRates[selectedCrypto] || 0) * (userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES);
  const currentRate = lockedRate || liveRate;
  const cryptoAmount = parseFloat(fiatAmount || '0') / (currentRate || 1);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onClose} 
        style={styles.closeButtonContainer}
        activeOpacity={0.5}
      >
        <Text style={styles.closeButton}>✕</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Buy Crypto</Text>
        </View>

      {/* Payment Method Selector */}
      <View style={styles.paymentMethodSection}>
        <Text style={styles.paymentSectionTitle}>Choose Payment Method</Text>
        <View style={styles.paymentMethodSelector}>
          <TouchableOpacity
            style={[
              styles.paymentOption, 
              paymentMethod === 'balance' && styles.selectedPayment,
              (userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0) === 0 && styles.emptyWalletOption
            ]}
            onPress={() => {
              const balance = userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0;
              if (balance === 0) {
                Alert.alert(
                  'Empty Wallet',
                  'Your wallet is empty. Please deposit funds first.',
                  [{ text: 'OK' }]
                );
              } else {
                setPaymentMethod('balance');
              }
            }}
          >
            <View style={styles.paymentHeader}>
              <View style={[styles.paymentIconContainer, styles.walletIcon]}>
                <View style={styles.walletIconShape} />
              </View>
              <Text style={[styles.paymentTitle]}>
                {userCountry === 'NG' ? '🇳🇬 Nigeria' : '🇰🇪 Kenya'} Balance
              </Text>
            </View>
            <Text style={[
              styles.balanceAmount, 
              paymentMethod === 'balance' && styles.selectedBalanceText,
              (userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0) === 0 && styles.emptyBalanceText
            ]}>
              {userCountry === 'NG' ? '₦' : 'KSh'}{(userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0).toLocaleString()}
            </Text>
            <Text style={styles.paymentSubtext}>
              {(userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0) === 0 ? 'Empty - Deposit needed' : 'Instant purchase'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'bank' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('bank')}
          >
            <View style={styles.paymentHeader}>
              <View style={[styles.paymentIconContainer, userCountry === 'NG' ? styles.bankIcon : styles.mpesaIcon]}>
                {userCountry === 'NG' ? (
                  <View style={styles.bankIconShape} />
                ) : (
                  <View style={styles.mpesaIconShape} />
                )}
              </View>
              <Text style={[styles.paymentTitle]}>
                {userCountry === 'NG' ? 'Bank Transfer' : 'M-Pesa'}
              </Text>
            </View>
            <Text style={[styles.balanceAmount, paymentMethod === 'bank' && styles.selectedBalanceText]}>External</Text>
            <Text style={styles.paymentSubtext}>1-24 hours processing</Text>
          </TouchableOpacity>
        </View>
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
            🔒 Locked Rate: {userCountry === 'NG' ? '₦' : 'KSh'}{lockedRate.toLocaleString()} per {selectedCrypto}
            {rateLockedAt && (
              <Text style={styles.lockTime}>
                \n(Locked at {rateLockedAt.toLocaleTimeString()})
              </Text>
            )}
          </>
        ) : (
          <>Live Rate: {userCountry === 'NG' ? '₦' : 'KSh'}{((usdRates[selectedCrypto] || 0) * (userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per {selectedCrypto}</>
        )}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Amount in ${userCountry === 'NG' ? 'NGN' : 'KES'}`}
          value={fiatAmount}
          onChangeText={setFiatAmount}
          keyboardType="numeric"
        />
        <Text style={styles.limitsText}>
          Min: {userCountry === 'NG' ? '₦' : 'KSh'}{((selectedCrypto === 'BTC' ? 10 : selectedCrypto === 'ETH' ? 5 : 1) * (userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES)).toLocaleString('en-US', { maximumFractionDigits: 0 })} | 
          Max: {userCountry === 'NG' ? '₦' : 'KSh'}{((selectedCrypto === 'BTC' ? 50000 : selectedCrypto === 'ETH' ? 30000 : 100000) * (userCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </Text>
      </View>

      {fiatAmount && (
        <Text style={styles.preview}>
          You'll receive: {cryptoAmount.toFixed(8)} {selectedCrypto}
        </Text>
      )}

      {paymentMethod === 'bank' && (
        <View style={styles.bankInfo}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Text style={styles.bankText}>
            {userCountry === 'NG' 
              ? 'GTBank\nAccount: 0123456789\nBPay Technologies Ltd'
              : 'M-Pesa\nPaybill: 123456\nAccount: BPAY001'
            }
          </Text>
        </View>
      )}
      
      {paymentMethod === 'balance' && parseFloat(fiatAmount || '0') > (userCountry === 'NG' ? userBalance?.NGN || 0 : userBalance?.KES || 0) && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ Insufficient balance. Use Deposit to add funds or select Bank Transfer.</Text>
        </View>
      )}

      {orderStep === 'create' && (
        <TouchableOpacity
          style={[styles.buyButton, loading && styles.disabledButton]}
          onPress={handleCreateEscrow}
          disabled={loading}
        >
          <Text style={styles.buyButtonText}>
            {loading ? 'Creating Order...' : 'Create Buy Order'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>
        {paymentMethod === 'balance' 
          ? 'Crypto will be added to your wallet instantly after purchase.'
          : 'After creating the request, make payment to the account above. Upload payment proof to receive your crypto within 1-24 hours.'
        }
      </Text>
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
            onNotification(`Rated admin ${rating} stars - thank you for your feedback!`, 'success');
          }}
          onRaiseDispute={(reason) => {
            onNotification(`Dispute raised: ${reason} - admin will review shortly`, 'warning');
          }}
          onTradeComplete={(status, message) => {
            setShowChat(false);
            setCurrentTrade(null);
            
            if (status === 'approved') {
              onNotification(`🎉 ${message} - Your crypto has been added to your wallet!`, 'success');
              onSuccess();
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
  cryptoContent: {
    alignItems: 'center',
    gap: 8,
  },
  selectedCrypto: {
    backgroundColor: '#10b981',
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
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  limitsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  preview: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 20,
  },
  bankInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  bankText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buyButtonText: {
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
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 12,
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPayment: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.2,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletIcon: {
    backgroundColor: '#f59e0b',
  },
  walletIconShape: {
    width: 16,
    height: 12,
    backgroundColor: 'white',
    borderRadius: 2,
    position: 'relative',
  },
  bankIcon: {
    backgroundColor: '#1e40af',
  },
  bankIconShape: {
    width: 18,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 2,
    borderTopWidth: 3,
    borderTopColor: 'white',
  },
  mpesaIcon: {
    backgroundColor: '#16a34a',
  },
  mpesaIconShape: {
    width: 14,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  selectedBalanceText: {
    color: '#f59e0b',
  },
  paymentSubtext: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
  },
  emptyWalletOption: {
    opacity: 0.6,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  emptyBalanceText: {
    color: '#ef4444',
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
  paymentSection: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 16,
    textAlign: 'center',
  },
  paidButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  paidButtonText: {
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
  proofSection: {
    marginBottom: 20,
  },
  proofTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  proofSubtitle: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  proofPreview: {
    alignItems: 'center',
  },
  proofImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeProofButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeProofText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  uploadingText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});