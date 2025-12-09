import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, Modal, Platform, Dimensions } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LoadingSpinner } from './src/components/LoadingSpinner';
import { CryptoIcon } from './src/components/CryptoIcon';
import { NotificationBell } from './src/components/NotificationBell';
import { NavIcon } from './src/components/NavIcon';
import { SellCryptoScreen } from './src/screens/SellCryptoScreen';
import { BuyRequestScreen } from './src/screens/BuyRequestScreen';
import { TradeHistoryScreen } from './src/screens/TradeHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DepositScreen } from './src/screens/DepositScreen';
import { CryptoWalletScreen } from './src/screens/CryptoWalletScreen';
import { ConvertScreen } from './src/screens/ConvertScreen';
import { AdminLoginScreen } from './src/screens/AdminLoginScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminPendingTradesScreen } from './src/screens/AdminPendingTradesScreen';
import { AdminRateManagementScreen } from './src/screens/AdminRateManagementScreen';
import { apiService } from './src/services/api';
import { storage } from './src/utils/storage';
import { User, Balance, CryptoRate, Notification, CryptoWallet } from './src/types';

const LoginScreen: React.FC<{
  isSignup: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  loading: boolean;
  handleAuth: () => void;
  setIsSignup: (signup: boolean) => void;
}> = ({ isSignup, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, fullName, setFullName, showPassword, setShowPassword, loading, handleAuth, setIsSignup }) => (
  <View style={styles.safeArea}>
    <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
    <ScrollView 
      style={styles.loginContainer}
      contentContainerStyle={styles.loginContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Image 
            source={require('./assets/images/5782897843587714011_120.jpg')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>BPay</Text>
        <Text style={styles.subtitle}>Crypto to Cash Trading</Text>
        
        <View style={styles.flagsContainer}>
          <View style={styles.flagItem}>
            <Text style={styles.flagText}>Nigeria</Text>
          </View>
          <Text style={styles.flagSeparator}>|</Text>
          <View style={styles.flagItem}>
            <Text style={styles.flagText}>Kenya</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>
        
        {isSignup && (
          <TextInput 
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
            autoCorrect={false}
            accessibilityLabel="Full Name"
          />
        )}
        
        <TextInput 
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email Address"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCorrect={false}
            accessibilityLabel="Password"
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        
        {isSignup && (
          <>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                accessibilityLabel="Confirm Password"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.input}
              onPress={() => {
                const questions = [
                  'What is your mother\'s maiden name?',
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was your first car?',
                  'What is your favorite movie?'
                ];
                Alert.alert(
                  'Choose Security Question',
                  '',
                  questions.map(q => ({
                    text: q,
                    onPress: () => setSecurityQuestion(q)
                  }))
                );
              }}
            >
              <Text style={styles.inputText}>{securityQuestion}</Text>
            </TouchableOpacity>
            
            <TextInput 
              style={styles.input}
              placeholder="Security Answer"
              placeholderTextColor="#64748b"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
              autoCorrect={false}
              accessibilityLabel="Security Answer"
            />
          </>
        )}
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleAuth}
          disabled={loading}
          accessibilityLabel={isSignup ? 'Create Account' : 'Login'}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            setIsSignup(!isSignup);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
          }}
        >
          <Text style={styles.linkText}>
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
        
        {!isSignup && (
          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={() => {
              Alert.prompt(
                'Reset Password',
                'Enter your email address:',
                async (email) => {
                  if (email) {
                    try {
                      const response = await fetch('https://bpay-app.onrender.com/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        Alert.prompt(
                          'Security Question',
                          data.securityQuestion,
                          async (answer) => {
                            if (answer) {
                              Alert.prompt(
                                'New Password',
                                'Enter your new password:',
                                async (newPassword) => {
                                  if (newPassword) {
                                    try {
                                      const resetResponse = await fetch('https://bpay-app.onrender.com/api/auth/reset-password', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, securityAnswer: answer, newPassword })
                                      });
                                      const resetData = await resetResponse.json();
                                      if (resetResponse.ok) {
                                        Alert.alert('Success', 'Password reset successfully!');
                                      } else {
                                        Alert.alert('Error', resetData.error);
                                      }
                                    } catch (error) {
                                      Alert.alert('Error', 'Network error');
                                    }
                                  }
                                },
                                'secure-text'
                              );
                            }
                          }
                        );
                      } else {
                        Alert.alert('Error', data.error || 'This account was created before security questions were added. Please contact support.');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Network error');
                    }
                  }
                }
              );
            }}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  </View>
);

export default function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What is your mother\'s maiden name?');
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [userCountry, setUserCountry] = useState<'NG' | 'KE'>('NG');
  const [isLoading, setIsLoading] = useState(true);
  
  // App state
  const [rates, setRates] = useState<Record<string, CryptoRate>>({});
  const [usdRates, setUsdRates] = useState<Record<string, number>>({});
  const [exchangeRates, setExchangeRates] = useState({ USDNGN: 0, USDKES: 0 });
  const [balance, setBalance] = useState<Balance>({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet>({ BTC: '', ETH: '', USDT: '' });
  const [showCryptoWallet, setShowCryptoWallet] = useState(false);
  const [showConvertScreen, setShowConvertScreen] = useState(false);
  const [predictions, setPredictions] = useState<any>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeCountry, setActiveCountry] = useState<'NG' | 'KE'>('NG');
  const [selectedAccount, setSelectedAccount] = useState<'nigeria' | 'kenya' | 'crypto'>('crypto');
  const scrollViewRef = useRef<ScrollView>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userKycStatus, setUserKycStatus] = useState<'pending' | 'processing' | 'verified' | 'rejected'>('pending');
  const [isVerified, setIsVerified] = useState(false);
  const [showDepositScreen, setShowDepositScreen] = useState(false);
  const [lockedRates, setLockedRates] = useState<Record<string, { rate: number; timestamp: number }>>({});
  const [priceAlerts, setPriceAlerts] = useState({
    BTC_100K: { triggered: false, target: 100000 },
    USDT_KES_HIGH: { triggered: false, target: 129 },
    USDT_KES_LOW: { triggered: false, target: 128 }
  });
  const [alertsInitialized, setAlertsInitialized] = useState(false);
  
  // Screen state
  const [showSellScreen, setShowSellScreen] = useState(false);
  const [showBuyScreen, setShowBuyScreen] = useState(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  


  // Check for saved login on app start
  useEffect(() => {
    const checkSavedLogin = async () => {
      try {
        const savedToken = await storage.getItem('userToken');
        const savedEmail = await storage.getItem('userEmail');
        const savedAvatar = await storage.getItem('userAvatar');
        
        if (savedToken && savedEmail) {
          setUserToken(savedToken);
          setEmail(savedEmail);
          setUserAvatar(savedAvatar);
          setIsLoggedIn(true);
          
          // Clear any existing notifications and add welcome
          setNotifications([]);
          addNotification('Welcome back to BPay!', 'success');
          
          // Load all user data from backend
          loadBalance(savedToken);
          loadUserProfile(savedToken);
          loadCryptoWallets(savedToken);
        }
      } catch (error) {
        console.log('No saved login found');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSavedLogin();
  }, []);
  
  // Fetch real-time rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const ratesData = await apiService.getRates();
        setRates(ratesData);
      } catch (error) {
        console.log('Failed to fetch rates');
      }
    };
    
    const fetchUsdRates = async () => {
      // Don't show updating for every 2-second update
      // setIsUpdating(true);
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd', {
        headers: {
          'Accept': 'application/json',
        }
      });
        const data = await response.json();
        const newRates = {
          BTC: data.bitcoin?.usd || 95000,
          ETH: data.ethereum?.usd || 3400,
          USDT: data.tether?.usd || 1,
        };
        
        // Check for significant price changes and notify
        Object.entries(newRates).forEach(([crypto, newPrice]) => {
          const oldPrice = usdRates[crypto];
          if (oldPrice && oldPrice > 0) {
            const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
            
            if (Math.abs(changePercent) >= 2) {
              const direction = changePercent > 0 ? '📈' : '📉';
              const sign = changePercent > 0 ? '+' : '';
              addNotification(
                `${direction} ${crypto} ${sign}${changePercent.toFixed(1)}% - Now $${newPrice.toLocaleString()}`,
                changePercent > 0 ? 'success' : 'warning'
              );
            }
            
            // High/Low alerts
            if (changePercent >= 10) {
              addNotification(
                `${crypto} News: New 24h high reached! Up ${changePercent.toFixed(1)}% - Strong buying pressure`,
                'success'
              );
            } else if (changePercent <= -10) {
              addNotification(
                `${crypto} Alert: 24h low hit! Down ${Math.abs(changePercent).toFixed(1)}% - Potential opportunity`,
                'warning'
              );
            }
            
            // Only show significant portfolio changes
            const totalValue = (balance.BTC * (usdRates.BTC || 0)) + (balance.ETH * (usdRates.ETH || 0)) + (balance.USDT * (usdRates.USDT || 1));
            if (totalValue > 0 && Math.abs(changePercent) >= 5) {
              addNotification(`Portfolio Alert: ${crypto} movement affects your holdings by ${Math.abs(changePercent * (balance[crypto as keyof Balance] || 0) * newPrice).toFixed(2)} USD`, 'info');
            }
          }
        });
        
        // Store previous rates for change calculation
        setRates(prev => {
          const updatedRates: any = {};
          Object.keys(newRates).forEach(crypto => {
            updatedRates[crypto] = {
              ...prev[crypto],
              lastPrice: prev[crypto]?.lastPrice || newRates[crypto as keyof typeof newRates],
              buy: newRates[crypto as keyof typeof newRates],
              sell: newRates[crypto as keyof typeof newRates],
              lastUpdated: new Date().toISOString()
            };
          });
          return updatedRates;
        });
        
        setUsdRates(newRates);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Only check price alerts if we have valid exchange rates
        if (exchangeRates.USDKES > 0) {
          checkPriceAlerts(newRates);
        }
      } catch (error) {
        console.log('Failed to fetch USD rates:', error);
        // Only set fallback if no existing rates and show error
        if (Object.keys(usdRates).length === 0) {
          addNotification('Unable to fetch live rates - using cached data', 'warning');
        }
      } finally {
        // setIsUpdating(false);
      }
    };
    
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRates({
          USDNGN: data.rates?.NGN || 1600,
          USDKES: data.rates?.KES || 150,
        });
      } catch (error) {
        console.log('Failed to fetch exchange rates');
        setExchangeRates({ USDNGN: 1600, USDKES: 150 });
      }
    };
    
    fetchRates();
    fetchUsdRates();
    fetchExchangeRates();
    fetchPredictions();
    
    const interval = setInterval(() => {
      fetchUsdRates();
    }, 60000);
    
    const exchangeInterval = setInterval(() => {
      fetchExchangeRates();
    }, 30000);
    
    const predictionInterval = setInterval(() => {
      fetchPredictions();
    }, 600000);
    
    return () => {
      clearInterval(interval);
      clearInterval(exchangeInterval);
      clearInterval(predictionInterval);
    };
  }, []);
  
  const loadBalance = async (token: string) => {
    try {
      const balanceData = await apiService.getBalance(token);
      setBalance(balanceData);
    } catch (error) {
      console.log('Failed to load balance');
      // Set empty balance on error
      setBalance({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
    }
  };
  
  const loadCryptoWallets = async (token: string) => {
    try {
      const wallets = await apiService.getCryptoWallets(token);
      setCryptoWallets(wallets);
    } catch (error) {
      console.log('Failed to load crypto wallets');
    }
  };
  
  const fetchPredictions = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether&price_change_percentage=24h', {
        headers: {
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      
      const predictionData: any = {};
      data.forEach((coin: any) => {
        const crypto = coin.id === 'bitcoin' ? 'BTC' : coin.id === 'ethereum' ? 'ETH' : 'USDT';
        const change24h = coin.price_change_percentage_24h || 0;
        
        predictionData[crypto] = {
          currentPrice: coin.current_price,
          prediction24h: coin.current_price * (1 + (change24h * 0.3) / 100),
          change: change24h * 0.3,
          sentiment: change24h > 5 ? 'bullish' : change24h < -5 ? 'bearish' : 'neutral'
        };
        
        // Only major market movements (15%+)
        if (Math.abs(change24h) > 15) {
          addNotification(
            `${crypto} Alert: ${change24h > 0 ? 'Up' : 'Down'} ${Math.abs(change24h).toFixed(1)}% in 24h - High volatility`,
            change24h > 0 ? 'success' : 'warning'
          );
        }
      });
      
      setPredictions(predictionData);
    } catch (error) {
      console.log('Failed to fetch predictions');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (isSignup) {
      if (!fullName) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (isSignup) {
        await apiService.register({ 
          email, 
          password, 
          fullName,
          securityQuestion,
          securityAnswer
        });
        Alert.alert('Success', 'Account created! Please login.');
        setIsSignup(false);
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      } else {
        const result = await apiService.login(email, password);
        setUserToken(result.token);
        setFullName(result.user?.fullName || email);
        await storage.setItem('userToken', result.token);
        await storage.setItem('userEmail', email);
        setIsLoggedIn(true);
        
        // Clear any existing notifications and add welcome
        setNotifications([]);
        addNotification('Welcome to BPay!', 'success');
        
        // Load all user data from backend
        loadBalance(result.token);
        loadUserProfile(result.token);
        loadCryptoWallets(result.token);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  const addNotification = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const newNotification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type,
      read: false
    };
    console.log('Adding notification:', message); // Debug log
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
  };
  
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await storage.removeItem('userToken');
    await storage.removeItem('userEmail');
    // Don't remove avatar - keep it for this user
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setUserToken('');
    // Don't clear avatar - keep it
    setBalance({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
    setNotifications([]);
  };
  

  
  const handleUpdateAvatar = async (uri: string) => {
    setUserAvatar(uri);
    await storage.setItem('userAvatar', uri);
  };
  
  const loadUserProfile = async (token: string) => {
    try {
      const profile = await apiService.getUserProfile(token);
      setUserKycStatus(profile.kycStatus || 'pending');
      setIsVerified(profile.isVerified || false);
      setUserCountry(profile.country || 'NG');
      setActiveCountry(profile.country || 'NG');
      if (profile.kycStatus === 'processing') {
        addNotification('Your KYC verification is being processed. You will be notified once approved.', 'info');
      }
    } catch (error) {
      console.log('Failed to load user profile');
      setUserKycStatus('pending');
      setIsVerified(false);
    }
  };
  
  const checkVerificationRequired = () => {
    if (!isVerified && userKycStatus !== 'verified') {
      Alert.alert(
        'Account Verification Required',
        'You need to complete KYC verification to access trading features.',
        [
          { text: 'Verify Now', onPress: () => setShowProfileScreen(true) },
          { text: 'Later', style: 'cancel' }
        ]
      );
      return false;
    }
    return true;
  };
  
  const checkPriceAlerts = (rates: Record<string, number>) => {
    const btcPrice = rates.BTC || 0;
    const usdtKesRate = (rates.USDT || 1) * exchangeRates.USDKES;
    
    // Only check if we have valid exchange rates and prices
    if (exchangeRates.USDKES === 0 || btcPrice === 0) return;
    
    // Initialize alerts state on first valid data
    if (!alertsInitialized && usdtKesRate > 100) {
      setPriceAlerts(prev => ({
        BTC_100K: { triggered: btcPrice >= 100000, target: 100000 },
        USDT_KES_HIGH: { triggered: usdtKesRate >= 129, target: 129 },
        USDT_KES_LOW: { triggered: usdtKesRate <= 128, target: 128 }
      }));
      setAlertsInitialized(true);
      return;
    }
    
    if (!alertsInitialized) return;
    
    // BTC hits $100K alert
    if (btcPrice >= 100000 && !priceAlerts.BTC_100K.triggered) {
      addNotification(
        `MILESTONE ALERT: Bitcoin hits $${btcPrice.toLocaleString()}! Historic $100K breakthrough!`,
        'success'
      );
      setPriceAlerts(prev => ({
        ...prev,
        BTC_100K: { ...prev.BTC_100K, triggered: true }
      }));
    }
    
    // USDT rate alerts for both currencies
    const usdtNgnRate = (rates.USDT || 1) * exchangeRates.USDNGN;
    
    if (usdtKesRate > 100 && usdtKesRate < 200) {
      if (usdtKesRate >= 129 && !priceAlerts.USDT_KES_HIGH.triggered) {
        addNotification(
          `USDT Alert: Rate hits KSh ${usdtKesRate.toFixed(2)} / ₦${usdtNgnRate.toFixed(2)} - High end of target range!`,
          'warning'
        );
        setPriceAlerts(prev => ({
          ...prev,
          USDT_KES_HIGH: { ...prev.USDT_KES_HIGH, triggered: true }
        }));
      }
      
      if (usdtKesRate <= 128 && !priceAlerts.USDT_KES_LOW.triggered) {
        addNotification(
          `USDT Alert: Rate drops to KSh ${usdtKesRate.toFixed(2)} / ₦${usdtNgnRate.toFixed(2)} - Low end of target range!`,
          'info'
        );
        setPriceAlerts(prev => ({
          ...prev,
          USDT_KES_LOW: { ...prev.USDT_KES_LOW, triggered: true }
        }));
      }
    }
    
    // Reset alerts when prices move away from targets
    if (btcPrice < 98000 && priceAlerts.BTC_100K.triggered) {
      setPriceAlerts(prev => ({
        ...prev,
        BTC_100K: { ...prev.BTC_100K, triggered: false }
      }));
    }
    
    if (usdtKesRate < 127 || usdtKesRate > 130) {
      setPriceAlerts(prev => ({
        ...prev,
        USDT_KES_HIGH: { ...prev.USDT_KES_HIGH, triggered: false },
        USDT_KES_LOW: { ...prev.USDT_KES_LOW, triggered: false }
      }));
    }
  };

  const lockRateForTrade = (crypto: string, type: 'buy' | 'sell') => {
    const currentRate = usdRates[crypto] || 0;
    const exchangeRate = activeCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES;
    const localRate = Math.round(currentRate * exchangeRate);
    
    const rateKey = `${crypto}_${type}`;
    setLockedRates(prev => ({
      ...prev,
      [rateKey]: {
        rate: localRate,
        timestamp: Date.now()
      }
    }));
    
    return localRate;
  };

  const DashboardScreen = () => (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.profileAvatar}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.avatarText}>{fullName[0] || 'U'}</Text>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{fullName || email}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <NotificationBell 
              unreadCount={notifications.filter(n => !n.read).length}
              onPress={() => setShowNotifications(true)}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        {/* Balance Overview */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Your Balances</Text>
          
          {/* Account Tabs */}
          <View style={styles.accountTabs}>
            <TouchableOpacity 
              style={[styles.tab, selectedAccount === 'crypto' && styles.activeTab]}
              onPress={() => setSelectedAccount('crypto')}
            >
              <Text style={[styles.tabText, selectedAccount === 'crypto' && styles.activeTabText]}>Crypto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedAccount === 'nigeria' && styles.activeTab]}
              onPress={() => {
                setSelectedAccount('nigeria');
                setActiveCountry('NG');
              }}
            >
              <Text style={[styles.tabText, selectedAccount === 'nigeria' && styles.activeTabText]}>NG Nigeria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedAccount === 'kenya' && styles.activeTab]}
              onPress={() => {
                setSelectedAccount('kenya');
                setActiveCountry('KE');
              }}
            >
              <Text style={[styles.tabText, selectedAccount === 'kenya' && styles.activeTabText]}>KE Kenya</Text>
            </TouchableOpacity>
          </View>
          
          {/* Balance Card */}
          <View style={[styles.balanceCard, styles.singleCard]}>
            {selectedAccount === 'crypto' && (
              <>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceCountry}>Crypto Assets</Text>
                </View>
                <View style={styles.cryptoBalances}>
                  <View style={styles.cryptoBalance}>
                    <CryptoIcon crypto="BTC" size={16} />
                    <Text style={styles.cryptoAmount}>{balance.BTC?.toFixed(6) || '0.000000'} BTC</Text>
                  </View>
                  <View style={styles.cryptoBalance}>
                    <CryptoIcon crypto="ETH" size={16} />
                    <Text style={styles.cryptoAmount}>{balance.ETH?.toFixed(4) || '0.0000'} ETH</Text>
                  </View>
                  <View style={styles.cryptoBalance}>
                    <CryptoIcon crypto="USDT" size={16} />
                    <Text style={styles.cryptoAmount}>{balance.USDT?.toFixed(2) || '0.00'} USDT</Text>
                  </View>
                </View>
              </>
            )}
            
            {selectedAccount === 'nigeria' && (
              <>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceCountry}>Nigeria (NGN)</Text>
                </View>
                <Text style={styles.balanceAmount}>₦{balance.NGN?.toLocaleString() || '0'}</Text>
              </>
            )}
            
            {selectedAccount === 'kenya' && (
              <>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceCountry}>Kenya (KES)</Text>
                </View>
                <Text style={styles.balanceAmount}>KSh{balance.KES?.toLocaleString() || '0'}</Text>
              </>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.compactActions}>
            {selectedAccount === 'crypto' ? (
              // Crypto account actions
              <>
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowSellScreen(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.compactIconText, { color: '#ef4444' }]}>S</Text>
                  </View>
                  <Text style={styles.compactText}>Sell</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowCryptoWallet(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.compactIconText, { color: '#10b981' }]}>D</Text>
                  </View>
                  <Text style={styles.compactText}>Deposit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowCryptoWallet(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.compactIconText, { color: '#f59e0b' }]}>W</Text>
                  </View>
                  <Text style={styles.compactText}>Wallet</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowConvertScreen(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#dbeafe' }]}>
                    <Text style={[styles.compactIconText, { color: '#3b82f6' }]}>C</Text>
                  </View>
                  <Text style={styles.compactText}>Convert</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Fiat account actions (Nigeria/Kenya)
              <>
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowBuyScreen(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.compactIconText, { color: '#10b981' }]}>B</Text>
                  </View>
                  <Text style={styles.compactText}>Buy Crypto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.compactButton} onPress={() => setShowDepositScreen(true)}>
                  <View style={[styles.compactIconCircle, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.compactIconText, { color: '#f59e0b' }]}>A</Text>
                  </View>
                  <Text style={styles.compactText}>Add Funds</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Live Rates */}
        <View style={styles.ratesSection}>
          <View style={styles.ratesHeader}>
            <Text style={styles.sectionTitle}>Live Rates</Text>
            <View style={styles.updateInfo}>
              {isUpdating ? (
                <Text style={styles.updating}>Updating...</Text>
              ) : (
                <Text style={styles.ratesSubtitle}>
                  {lastUpdate ? `Updated ${lastUpdate}` : 'Loading...'}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.ratesList}>
            {Object.entries(rates).map(([crypto, rate], index) => (
              <View key={`rate-${crypto}-${index}`} style={styles.rateCard}>
                <View style={styles.rateLeft}>
                  <CryptoIcon crypto={crypto as 'BTC' | 'ETH' | 'USDT'} size={32} />
                  <View style={styles.rateInfo}>
                    <Text style={styles.cryptoName}>{crypto}</Text>
                    <Text style={styles.cryptoFullName}>
                      {crypto === 'BTC' ? 'Bitcoin' : crypto === 'ETH' ? 'Ethereum' : 'Tether'}
                    </Text>
                  </View>
                </View>
                <View style={styles.rateRight}>
                  <Text style={styles.usdPrice}>
                    ${usdRates[crypto]?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.ratePrice}>
                    {selectedAccount === 'crypto' ? 
                      `$${usdRates[crypto]?.toLocaleString() || '0'}` :
                      `${activeCountry === 'NG' ? '₦' : 'KSh'}${((usdRates[crypto] || 0) * (activeCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </Text>
                  <Text style={[styles.rateChange, 
                    (usdRates[crypto] > (rates[crypto]?.lastPrice || 0)) && styles.positiveChange,
                    (usdRates[crypto] < (rates[crypto]?.lastPrice || 0)) && styles.negativeChange
                  ]}>
                    {rates[crypto]?.lastPrice ? 
                      `${((usdRates[crypto] - rates[crypto].lastPrice) / rates[crypto].lastPrice * 100).toFixed(2)}%` : 
                      'Live'
                    }
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>


        




        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
        >
          <NavIcon name="home" color={activeTab === 'home' ? '#f59e0b' : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        {selectedAccount === 'crypto' && (
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'sell' && styles.activeNavItem]}
            onPress={() => {
              if (selectedAccount !== 'crypto') {
                Alert.alert('Switch Account', 'Please switch to Crypto account to sell crypto assets.');
                return;
              }
              setActiveTab('sell');
              setShowSellScreen(true);
            }}
          >
            <NavIcon name="sell" color={activeTab === 'sell' ? '#f59e0b' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'sell' && styles.activeNavText]}>Sell</Text>
          </TouchableOpacity>
        )}
        
        {selectedAccount !== 'crypto' && (
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'buy' && styles.activeNavItem]}
            onPress={() => {
              setActiveTab('buy');
              setShowBuyScreen(true);
            }}
          >
            <NavIcon name="buy" color={activeTab === 'buy' ? '#f59e0b' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'buy' && styles.activeNavText]}>Buy</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'history' && styles.activeNavItem]}
          onPress={() => {
            setActiveTab('history');
            setShowHistoryScreen(true);
          }}
        >
          <NavIcon name="history" color={activeTab === 'history' ? '#f59e0b' : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'history' && styles.activeNavText]}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => {
            setActiveTab('profile');
            setShowProfileScreen(true);
          }}
        >
          <NavIcon name="profile" color={activeTab === 'profile' ? '#f59e0b' : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading BPay..." />;
  }

  return (
    <ErrorBoundary>
      <View style={styles.app}>
        {!isLoggedIn ? (
          <LoginScreen 
            isSignup={isSignup}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            fullName={fullName}
            setFullName={setFullName}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            handleAuth={handleAuth}
            setIsSignup={setIsSignup}
          />
        ) : (
          <DashboardScreen />
        )}
        
        <Modal visible={showSellScreen} animationType="slide">
          <SellCryptoScreen
            rates={rates}
            usdRates={usdRates}
            exchangeRates={exchangeRates}
            token={userToken}
            userCountry={activeCountry}
            userBalance={balance}
            onClose={() => {
              setShowSellScreen(false);
              setActiveTab('home');
            }}
            onSuccess={() => {
              setShowSellScreen(false);
              setActiveTab('home');
              loadBalance(userToken);
              addNotification('Sell order created - awaiting payment processing', 'success');
            }}
            onLockRate={lockRateForTrade}
            onNotification={addNotification}
          />
        </Modal>
        
        <Modal visible={showBuyScreen} animationType="slide">
          <BuyRequestScreen
            rates={rates}
            usdRates={usdRates}
            exchangeRates={exchangeRates}
            token={userToken}
            userCountry={activeCountry}
            userBalance={balance}
            onClose={() => {
              setShowBuyScreen(false);
              setActiveTab('home');
            }}
            onSuccess={() => {
              setShowBuyScreen(false);
              setActiveTab('home');
              addNotification('Buy request created - make payment to complete', 'info');
            }}
            onLockRate={lockRateForTrade}
            onNotification={addNotification}
          />
        </Modal>
        
        <Modal visible={showHistoryScreen} animationType="slide">
          <TradeHistoryScreen
            token={userToken}
            userCountry={activeCountry}
            onClose={() => {
              setShowHistoryScreen(false);
              setActiveTab('home');
            }}
          />
        </Modal>
        
        <Modal visible={showProfileScreen} animationType="slide">
          <ProfileScreen
            userEmail={email}
            fullName={fullName}
            onClose={() => {
              setShowProfileScreen(false);
              setActiveTab('home');
            }}
            onLogout={() => {
              setShowProfileScreen(false);
              setActiveTab('home');
              handleLogout();
            }}
            onUpdateProfile={(newEmail: string) => {
              setEmail(newEmail);
              storage.setItem('userEmail', newEmail);
            }}
            userToken={userToken}
            avatarUri={userAvatar}
            onUpdateAvatar={handleUpdateAvatar}
            kycStatus={userKycStatus}
            onKycSubmit={(status) => {
              setUserKycStatus(status);
              addNotification('KYC documents submitted for review', 'info');
            }}
            onNotification={addNotification}
          />
        </Modal>
        
        <Modal visible={showDepositScreen} animationType="slide">
          <DepositScreen
            userCountry={activeCountry}
            onClose={() => setShowDepositScreen(false)}
            onSuccess={() => {
              setShowDepositScreen(false);
              addNotification('Fiat deposit submitted - pending verification', 'info');
            }}
          />
        </Modal>
        
        <Modal visible={showCryptoWallet} animationType="slide">
          <CryptoWalletScreen
            wallets={cryptoWallets}
            onClose={() => setShowCryptoWallet(false)}
            onSuccess={() => {
              setShowCryptoWallet(false);
              loadBalance(userToken);
              addNotification('Crypto deposit verified and added to wallet', 'success');
            }}
            userToken={userToken}
          />
        </Modal>
        
        <Modal visible={showConvertScreen} animationType="slide">
          <ConvertScreen
            balance={balance}
            usdRates={usdRates}
            onClose={() => setShowConvertScreen(false)}
            onSuccess={() => {
              setShowConvertScreen(false);
              loadBalance(userToken);
              addNotification('Crypto conversion completed successfully', 'success');
            }}
            userToken={userToken}
          />
        </Modal>
        
        <Modal visible={showNotifications} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.notificationModal}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>Notifications</Text>
                <TouchableOpacity 
                  style={styles.closeButtonContainer}
                  onPress={() => {
                    markNotificationsAsRead();
                    setShowNotifications(false);
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <Text style={styles.noNotifications}>No notifications</Text>
                ) : (
                  notifications.map((notification, index) => (
                    <View key={`notification-${notification.id}-${index}`} style={[styles.notificationItem, !notification.read && styles.unreadNotification]}>
                      <View style={styles.notificationContent}>
                        <View style={[styles.notificationIcon, 
                          notification.type === 'success' && styles.successIcon,
                          notification.type === 'warning' && styles.warningIcon,
                          notification.type === 'info' && styles.infoIcon
                        ]}>
                          <View style={styles.iconIndicator} />
                        </View>
                        <View style={styles.notificationText}>
                          <Text style={styles.notificationMessage}>{notification.message}</Text>
                          <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                        </View>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        

      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  
  // Login Screen
  loginContainer: {
    flex: 1,
  },
  loginContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    marginBottom: 20,
  },
  flagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagItem: {
    alignItems: 'center',
    gap: 4,
  },
  flagSeparator: {
    color: '#94a3b8',
    fontSize: 16,
  },
  flag: {
    fontSize: 24,
  },
  flagText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  
  loginForm: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 18,
    borderRadius: 16,
    fontSize: 17,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  passwordInput: {
    flex: 1,
    padding: 18,
    fontSize: 17,
  },
  eyeButton: {
    padding: 18,
  },
  eyeIcon: {
    fontSize: 16,
    color: '#64748b',
  },
  loginButton: {
    backgroundColor: '#f59e0b',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  
  // Dashboard Screen
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1a365d',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
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
  profileAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  notificationCard: {
    backgroundColor: '#fef3c7',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: '#92400e',
  },
  

  balanceLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  balanceNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  accountsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 15,
  },
  accountCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeAccount: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  countryFlag: {
    fontSize: 24,
    marginBottom: 5,
  },
  countryName: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellCard: {
    backgroundColor: '#ef4444',
  },
  buyCard: {
    backgroundColor: '#10b981',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  
  ratesCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  ratesList: {
    gap: 8,
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cryptoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoIconText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  rateRight: {
    alignItems: 'flex-end',
  },
  usdPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  ratePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  rateSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  historyButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  historyButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  historyArrow: {
    color: '#64748b',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  balanceSection: {
    padding: 20,
    paddingTop: 24,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  singleCard: {
    marginHorizontal: 0,
  },
  cryptoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cryptoBalances: {
    gap: 8,
  },
  cryptoBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cryptoAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },

  balanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 120,
  },
  activeBalanceCard: {
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  balanceCountry: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sellButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  buyButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 24,
    color: '#64748b',
  },
  ratesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ratesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratesSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  updateInfo: {
    alignItems: 'flex-end',
  },
  updating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  rateCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rateInfo: {
    gap: 2,
  },
  cryptoFullName: {
    fontSize: 12,
    color: '#64748b',
  },
  rateChange: {
    fontSize: 12,
    color: '#64748b',
  },


  bottomPadding: {
    height: 80,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  activeNavItem: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  activeNavText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButtonContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  closeButton: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  notificationsList: {
    maxHeight: 300,
  },
  noNotifications: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    padding: 40,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  successIcon: {
    backgroundColor: '#dcfce7',
  },
  warningIcon: {
    backgroundColor: '#fef3c7',
  },
  infoIcon: {
    backgroundColor: '#dbeafe',
  },
  iconIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  notificationText: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1a365d',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unreadNotification: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  unreadDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  kycBanner: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  kycProcessing: {
    backgroundColor: '#dbeafe',
    borderLeftColor: '#3b82f6',
  },
  kycRejected: {
    backgroundColor: '#fee2e2',
    borderLeftColor: '#ef4444',
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  kycMessage: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  kycButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  kycButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  depositSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  depositButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  depositIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  depositIconText: {
    fontSize: 24,
    color: '#10b981',
    fontWeight: 'bold',
  },
  depositContent: {
    flex: 1,
  },
  depositTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  depositSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  depositArrow: {
    fontSize: 20,
    color: '#64748b',
  },
  compactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  compactButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactText: {
    fontSize: 11,
    color: '#1a365d',
    fontWeight: '600',
  },
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  inputText: {
    fontSize: 17,
    color: '#1e293b',
    paddingVertical: 18,
  },

});