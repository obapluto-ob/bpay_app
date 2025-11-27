import React, { useState, useEffect, useCallback, createContext, useContext, useReducer } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
// NetInfo import removed - will handle network status differently

// Enhanced storage with error handling
const AsyncStorage = {
  getItem: async (key) => {
    try {
      return global.storage?.[key] || null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (!global.storage) global.storage = {};
      global.storage[key] = value;
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  removeItem: async (key) => {
    try {
      if (global.storage) delete global.storage[key];
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};

// App State Management
const initialState = {
  user: null,
  isOnline: true,
  error: null,
  loading: false,
  trades: [],
  notifications: []
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_TRADE':
      return { ...state, trades: [...state.trades, action.payload] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AppContext = createContext();

// Error Boundary Component for React Native
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message || 'An unexpected error occurred'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner = ({ size = 'large', color = '#f59e0b' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={size} color={color} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Offline Banner
const OfflineBanner = ({ isOnline }) => {
  if (isOnline) return null;
  
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>No internet connection</Text>
    </View>
  );
};

const LoginForm = ({ 
  isSignup, 
  isForgotPassword, 
  showPassword, 
  showConfirmPassword, 
  email, 
  password, 
  confirmPassword, 
  fullName, 
  loading,
  setEmail,
  setPassword,
  setConfirmPassword,
  setFullName,
  setShowPassword,
  setShowConfirmPassword,
  handleAuth,
  handleForgotPassword,
  setIsForgotPassword,
  setIsSignup
}) => (
  <KeyboardAvoidingView 
    style={styles.safeArea}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
    <ScrollView 
      style={styles.loginContainer}
      contentContainerStyle={styles.loginContent}
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
        <Text style={styles.regions}>NG Nigeria • KE Kenya</Text>

      </View>
      
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>
          {isForgotPassword ? 'Reset Password' : (isSignup ? 'Create Account' : 'Welcome Back')}
        </Text>
        
        {isSignup && (
          <TextInput 
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
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
        />
        
        {!isForgotPassword && (
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isSignup && !isForgotPassword && (
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
        )}
        

        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Please wait...' : 
              (isForgotPassword ? 'Send Reset Code' : 
                (isSignup ? 'Create Account' : 'Login'))}
          </Text>
        </TouchableOpacity>
        
        {!isSignup && !isForgotPassword && (
          <View style={styles.socialLogin}>
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}></Text>
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {!isForgotPassword && !isSignup && (
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            if (isForgotPassword) {
              setIsForgotPassword(false);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setFullName('');
            } else {
              setIsSignup(!isSignup);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setFullName('');
            }
          }}
        >
          <Text style={styles.linkText}>
            {isForgotPassword ? 'Back to Login' :
              (isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const VerificationForm = ({ 
  verificationCode,
  setVerificationCode,
  handleVerification,
  loading,
  setShowVerification,
  email,
  isForgotPassword
}) => (
  <KeyboardAvoidingView 
    style={styles.safeArea}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
    <ScrollView 
      style={styles.loginContainer}
      contentContainerStyle={styles.loginContent}
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
        <Text style={styles.subtitle}>{isForgotPassword ? 'Password Reset' : 'Verification Required'}</Text>
      </View>
      
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>{isForgotPassword ? 'Enter Reset Code' : 'Enter Verification Code'}</Text>
        <Text style={styles.verificationText}>We sent a 6-digit code to {email}</Text>
        
        <TextInput 
          style={styles.input}
          placeholder="Enter 6-digit code"
          placeholderTextColor="#64748b"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          maxLength={6}
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleVerification}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Verifying...' : (isForgotPassword ? 'Verify & Reset' : 'Verify & Login')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => setShowVerification(false)}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

function AppContent() {
  const { state, dispatch } = useAppContext();
  const [screen, setScreen] = useState('login');
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [balance, setBalance] = useState({ ngn: 0, btc: 0, eth: 0, usdt: 0 });
  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [userCountry, setUserCountry] = useState('NG');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [ratesLoading, setRatesLoading] = useState(false);
  const [lastRateUpdate, setLastRateUpdate] = useState(null);
  const [rates, setRates] = useState({
    BTC: { NGN: 52500000, KES: 6800000, change: '+2.5%' },
    ETH: { NGN: 3200000, KES: 415000, change: '+1.8%' },
    USDT: { NGN: 1520, KES: 129, change: '+0.1%' }
  });
  const [offlineRates, setOfflineRates] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchRates = async (showLoading = false) => {
    if (!state.isOnline && offlineRates) {
      setRates(offlineRates);
      return;
    }
    
    if (showLoading) setRatesLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=ngn,kes', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      const newRates = {
        BTC: {
          NGN: Math.round(data.bitcoin?.ngn || 52500000),
          KES: Math.round(data.bitcoin?.kes || 6800000),
          change: '+2.5%'
        },
        ETH: {
          NGN: Math.round(data.ethereum?.ngn || 3200000),
          KES: Math.round(data.ethereum?.kes || 415000),
          change: '+1.8%'
        },
        USDT: {
          NGN: Math.round(data.tether?.ngn || 1520),
          KES: Math.round(data.tether?.kes || 129),
          change: '+0.1%'
        }
      };
      
      setRates(newRates);
      setOfflineRates(newRates);
      setLastRateUpdate(new Date());
      await AsyncStorage.setItem('offlineRates', JSON.stringify(newRates));
      dispatch({ type: 'SET_ONLINE', payload: true });
      
    } catch (error) {
      console.error('Rate fetch error:', error);
      dispatch({ type: 'SET_ONLINE', payload: false });
      
      // Load offline rates
      try {
        const cached = await AsyncStorage.getItem('offlineRates');
        if (cached) {
          const cachedRates = JSON.parse(cached);
          setRates(cachedRates);
          setOfflineRates(cachedRates);
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
    } finally {
      if (showLoading) setRatesLoading(false);
    }
  };
  
  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    dispatch({ type: 'SET_ERROR', payload: error.message || 'An error occurred' });
  };
  
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };
  
  const addNotification = (title, message, type = 'info') => {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      time: 'Just now',
      read: false,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);
  };
  
  const calculateTotalPortfolio = () => {
    const btcValue = balance.btc * rates.BTC[selectedCurrency];
    const ethValue = balance.eth * rates.ETH[selectedCurrency];
    const usdtValue = balance.usdt * rates.USDT[selectedCurrency];
    const fiatValue = userCountry === 'NG' ? balance.ngn : 0;
    return btcValue + ethValue + usdtValue + fiatValue;
  };
  
  const getPortfolioChange = () => {
    // Calculate 24h change based on transactions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentTxs = transactions.filter(tx => new Date(tx.date) > yesterday);
    if (recentTxs.length === 0) return 0;
    
    const totalChange = recentTxs.reduce((sum, tx) => {
      return sum + (tx.type === 'buy' ? tx.cryptoAmount * rates[tx.crypto][selectedCurrency] : -tx.amount);
    }, 0);
    
    const currentValue = calculateTotalPortfolio();
    return currentValue > 0 ? (totalChange / currentValue) * 100 : 0;
  };
  
  const addTransaction = async (type, crypto, amount, cryptoAmount) => {
    const transaction = {
      id: Date.now(),
      type,
      crypto,
      amount,
      cryptoAmount,
      status: 'pending',
      date: new Date().toISOString(),
      paymentProof: null
    };
    
    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
    
    // Update balance for buy orders (pending admin approval)
    if (type === 'buy') {
      const newBalance = { ...balance };
      newBalance[crypto.toLowerCase()] += cryptoAmount;
      setBalance(newBalance);
      await AsyncStorage.setItem('balance', JSON.stringify(newBalance));
    }
    
    addNotification('Trade Created', `${type} order for ${cryptoAmount} ${crypto} created successfully`);
    return transaction;
  };
  
  const loadUserData = async () => {
    try {
      const savedBalance = await AsyncStorage.getItem('balance');
      const savedTransactions = await AsyncStorage.getItem('transactions');
      const savedProfile = await AsyncStorage.getItem('userProfile');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      
      if (savedBalance) setBalance(JSON.parse(savedBalance));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    } catch (error) {
      handleError(error, 'Load user data');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await checkAuthStatus();
        await loadUsers();
        await loadUserData();
        await detectUserCountry();
        await fetchRates(true);
      } catch (error) {
        handleError(error, 'App initialization');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initializeApp();
    
    const interval = setInterval(() => {
      fetchRates();
    }, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, [state.isOnline]);

  const detectUserCountry = async () => {
    try {
      // Try to get saved country preference first
      const savedCountry = await AsyncStorage.getItem('userCountry');
      if (savedCountry) {
        setUserCountry(savedCountry);
        setSelectedCurrency(savedCountry === 'NG' ? 'NGN' : 'KES');
        return;
      }
      
      // Use IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const detectedCountry = data.country_code === 'KE' ? 'KE' : 'NG'; // Default to NG
      
      setUserCountry(detectedCountry);
      setSelectedCurrency(detectedCountry === 'NG' ? 'NGN' : 'KES');
      await AsyncStorage.setItem('userCountry', detectedCountry);
    } catch (error) {
      // Fallback to Nigeria if detection fails
      setUserCountry('NG');
      setSelectedCurrency('NGN');
    }
  };

  const getLocalizedContent = () => {
    if (userCountry === 'KE') {
      return {
        flag: '🇰🇪',
        country: 'Kenya',
        currency: 'KES',
        symbol: 'KSh',
        greeting: 'Habari za asubuhi',
        paymentMethod: 'M-Pesa & Bank Transfer',
        localBank: 'Equity Bank, KCB'
      };
    }
    return {
      flag: '🇳🇬',
      country: 'Nigeria', 
      currency: 'NGN',
      symbol: '₦',
      greeting: 'Good morning',
      paymentMethod: 'Bank Transfer',
      localBank: 'GTBank, Access Bank'
    };
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('currentUser');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
        setIsLoggedIn(true);
        setScreen('dashboard');
      }
    } catch (error) {
      handleError(error, 'Auth check');
    }
  };

  const loadUsers = async () => {
    try {
      const savedUsers = await AsyncStorage.getItem('users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
    } catch (error) {
      handleError(error, 'Load users');
    }
  };

  const saveUsers = async (newUsers) => {
    try {
      const success = await AsyncStorage.setItem('users', JSON.stringify(newUsers));
      if (!success) throw new Error('Failed to save user data');
    } catch (error) {
      handleError(error, 'Save users');
      throw error;
    }
  };

  const handleAuth = async () => {
    if (isForgotPassword) {
      if (!email) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }
      const user = users.find(u => u.email === email);
      if (!user) {
        Alert.alert('Error', 'No account found with this email');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        setLoading(false);
        setShowVerification(true);
        Alert.alert('Reset Code Sent', `Your password reset code is: ${code}\n(In production, this would be sent via SMS/Email)`);
      }, 1500);
      return;
    }

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
      
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        Alert.alert('Error', 'Account with this email already exists');
        return;
      }
    }
    
    setLoading(true);
    
    setTimeout(async () => {
      if (isSignup) {
        const newUser = {
          id: Date.now(),
          email: email,
          password: password,
          fullName: fullName
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        await saveUsers(updatedUsers);
        setLoading(false);
        Alert.alert('Success', 'Account created successfully! Please login.');
        setIsSignup(false);
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      } else {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          // Generate and send verification code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setSentCode(code);
          setLoading(false);
          setShowVerification(true);
          Alert.alert('Verification Code Sent', `Your code is: ${code}\n(In production, this would be sent via SMS/Email)`);
        } else {
          setLoading(false);
          Alert.alert('Error', 'Invalid email or password');
        }
      }
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('currentUser');
      dispatch({ type: 'SET_USER', payload: null });
      setIsLoggedIn(false);
      setScreen('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      addNotification('Logged out successfully', 'success');
    } catch (error) {
      handleError(error, 'Logout');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignup(false);
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }
    
    if (verificationCode !== sentCode) {
      Alert.alert('Error', 'Invalid verification code');
      return;
    }
    
    setLoading(true);
    setTimeout(async () => {
      const user = users.find(u => u.email === email);
      
      if (isForgotPassword) {
        // Password reset flow
        setLoading(false);
        setShowVerification(false);
        setVerificationCode('');
        setIsForgotPassword(false);
        Alert.alert('Code Verified', 'You can now set a new password', [
          { text: 'OK', onPress: () => {
            // In a real app, you'd show a new password form
            Alert.alert('Demo', 'In production, you would now set a new password');
          }}
        ]);
      } else {
        // Login flow
        await AsyncStorage.setItem('userToken', 'demo-token');
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        setLoading(false);
        setIsLoggedIn(true);
        setScreen('dashboard');
        setShowVerification(false);
        setVerificationCode('');
        Alert.alert('Success', `Welcome back, ${user.fullName}!`);
      }
    }, 1000);
  };

  // Enhanced Dashboard with better loading states
  const DashboardScreen = () => {
    if (state.loading) {
      return <LoadingSpinner />;
    }
    
    return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{state.user?.fullName?.charAt(0) || 'U'}</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>{getLocalizedContent().greeting}</Text>
              <Text style={styles.headerTitle}>Welcome to {getLocalizedContent().country} {getLocalizedContent().flag}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                Alert.alert('Notifications', notifications.map(n => `${n.title}: ${n.message}`).join('\n\n'), [
                  {text: 'Mark All Read', onPress: () => setNotifications(prev => prev.map(n => ({...n, read: true})))},
                  {text: 'Close', style: 'cancel'}
                ]);
              }}
            >
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>●</Text>
                <Text style={styles.notificationIcon}>●</Text>
                <Text style={styles.notificationIcon}>●</Text>
              </View>
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowSideMenu(true)}
            >
              <View style={styles.menuLines}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance ({getLocalizedContent().currency})</Text>
            <TouchableOpacity 
              style={styles.countrySwitch}
              onPress={() => {
                const newCountry = userCountry === 'NG' ? 'KE' : 'NG';
                setUserCountry(newCountry);
                // Always sync currency with country
                setSelectedCurrency(newCountry === 'NG' ? 'NGN' : 'KES');
              }}
            >
              <Text style={styles.countrySwitchText}>Tap: {getLocalizedContent().flag}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{getLocalizedContent().symbol}{(userCountry === 'NG' ? 2450000 : 318500).toLocaleString()}</Text>
          <Text style={styles.btcBalance}>0.04567890 BTC ≈ {getLocalizedContent().symbol}{(userCountry === 'NG' ? 2400000 : 312000).toLocaleString()}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity 
              style={styles.balanceAction}
              onPress={() => Alert.alert('Deposit', 'Deposit functionality coming soon')}
            >
              <Text style={styles.balanceActionText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.balanceAction}
              onPress={() => Alert.alert('Withdraw', 'Withdraw functionality coming soon')}
            >
              <Text style={styles.balanceActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.buyCard]} 
            onPress={() => setScreen('trade')}
          >
            <Text style={styles.actionTitle}>Buy Crypto</Text>
            <Text style={styles.actionSubtitle}>BTC, ETH, USDT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.sellCard]} 
            onPress={() => setScreen('trade')}
          >
            <Text style={styles.actionTitle}>Sell Crypto</Text>
            <Text style={styles.actionSubtitle}>Get {getLocalizedContent().currency}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratesCard}>
          <View style={styles.ratesHeader}>
            <Text style={styles.cardTitle}>Market Rates</Text>
            <View style={styles.ratesHeaderRight}>
              {ratesLoading && <ActivityIndicator size="small" color="#f59e0b" />}
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => fetchRates(true)}
                disabled={ratesLoading}
              >
                <Text style={styles.refreshText}>↻</Text>
              </TouchableOpacity>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>Tap to switch: {getLocalizedContent().flag} {getLocalizedContent().currency}</Text>
              </View>
            </View>
          </View>
          {lastRateUpdate && (
            <Text style={styles.lastUpdateText}>
              Last updated: {lastRateUpdate.toLocaleTimeString()}
            </Text>
          )}
          <View style={styles.ratesList}>
            {Object.entries(rates).map(([crypto, data]) => {
              const cryptoImages = {
                BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
                ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
                USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
              };
              return (
                <View key={crypto} style={styles.rateItem}>
                  <View style={styles.rateLeft}>
                    <Image 
                      source={{uri: cryptoImages[crypto]}}
                      style={styles.rateImage}
                      defaultSource={require('./assets/images/5782897843587714011_120.jpg')}
                    />
                    <View>
                      <Text style={styles.ratePair}>{crypto}</Text>
                      <Text style={styles.rateChange}>{data.change}</Text>
                    </View>
                  </View>
                  <Text style={styles.ratePrice}>
                    {getLocalizedContent().symbol}{data[selectedCurrency].toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        

        
        <View style={styles.navigationBar}>
          <TouchableOpacity 
            style={[styles.navItem, screen === 'dashboard' && styles.activeNavItem]}
            onPress={() => setScreen('dashboard')}
          >
            <View style={[styles.navIcon, screen === 'dashboard' && styles.activeNavIcon]}>
              <Text style={[styles.navIconText, screen === 'dashboard' && styles.activeNavIconText]}>■</Text>
            </View>
            <Text style={[styles.navText, screen === 'dashboard' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, screen === 'trade' && styles.activeNavItem]}
            onPress={() => setScreen('trade')}
          >
            <View style={[styles.navIcon, screen === 'trade' && styles.activeNavIcon]}>
              <Text style={[styles.navIconText, screen === 'trade' && styles.activeNavIconText]}>↗</Text>
            </View>
            <Text style={[styles.navText, screen === 'trade' && styles.activeNavText]}>Trade</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, screen === 'wallet' && styles.activeNavItem]}
            onPress={() => setScreen('wallet')}
          >
            <View style={[styles.navIcon, screen === 'wallet' && styles.activeNavIcon]}>
              <Text style={[styles.navIconText, screen === 'wallet' && styles.activeNavIconText]}>◊</Text>
            </View>
            <Text style={[styles.navText, screen === 'wallet' && styles.activeNavText]}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, screen === 'history' && styles.activeNavItem]}
            onPress={() => setScreen('history')}
          >
            <View style={[styles.navIcon, screen === 'history' && styles.activeNavIcon]}>
              <Text style={[styles.navIconText, screen === 'history' && styles.activeNavIconText]}>≡</Text>
            </View>
            <Text style={[styles.navText, screen === 'history' && styles.activeNavText]}>History</Text>
          </TouchableOpacity>
        </View>
        
        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => {
            Alert.alert('Quick Actions', 'Choose an action', [
              {text: 'Quick Buy', onPress: () => setScreen('trade')},
              {text: 'Quick Sell', onPress: () => setScreen('trade')},
              {text: 'Send Money', onPress: () => Alert.alert('Send Money', 'Coming soon')},
              {text: 'Scan QR', onPress: () => Alert.alert('QR Scanner', 'Coming soon')},
              {text: 'Cancel', style: 'cancel'}
            ]);
          }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {showSideMenu && (
        <View style={styles.sideMenuOverlay}>
          <TouchableOpacity 
            style={styles.sideMenuBackdrop}
            onPress={() => setShowSideMenu(false)}
          />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setShowSideMenu(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSideMenu(false);
                Alert.alert('Profile Settings', 'Manage your account information', [
                  {text: 'Edit Name', onPress: () => Alert.prompt('Full Name', 'Enter your full name', async (text) => {
                    if (text) {
                      const updatedProfile = { ...userProfile, fullName: text };
                      setUserProfile(updatedProfile);
                      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                      addNotification('Profile Updated', `Name updated to ${text}`);
                    }
                  })},
                  {text: 'Change Email', onPress: () => Alert.alert('Change Email', 'Email change requires verification')},
                  {text: 'KYC Status', onPress: () => Alert.alert('KYC Verification', 'Status: Verified\nLevel: Basic\nUpgrade available')},
                  {text: 'Close', style: 'cancel'}
                ]);
              }}
            >
              <Text style={styles.menuItemText}>Profile Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSideMenu(false);
                Alert.alert('Security Settings', 'Manage your account security', [
                  {text: '2FA Setup', onPress: () => Alert.alert('Two-Factor Authentication', 'Current Status: Enabled\n\nYour account is protected with 2FA via SMS/Email verification.')},
                  {text: 'Change Password', onPress: () => Alert.alert('Change Password', 'Password change requires current password verification')},
                  {text: 'Login History', onPress: () => Alert.alert('Recent Logins', `Last login: Today at ${new Date().toLocaleTimeString()}\nDevice: Mobile App\nLocation: ${getLocalizedContent().country}`)},
                  {text: 'Close', style: 'cancel'}
                ]);
              }}
            >
              <Text style={styles.menuItemText}>Security</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSideMenu(false);
                Alert.alert('Support & Help', 'Get assistance with your account', [
                  {text: 'Live Chat', onPress: () => Alert.alert('Live Chat', 'Chat support available 24/7\n\nConnect with our support team for immediate assistance.')},
                  {text: 'Email Support', onPress: () => Alert.alert('Email Support', 'Send us an email at:\nsupport@bpay.com\n\nWe typically respond within 2-4 hours.')},
                  {text: 'FAQ', onPress: () => Alert.alert('Frequently Asked Questions', 'Common topics:\n• How to buy crypto\n• Payment methods\n• Account verification\n• Trading limits')},
                  {text: 'Close', style: 'cancel'}
                ]);
              }}
            >
              <Text style={styles.menuItemText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSideMenu(false);
                Alert.alert('About BPay', `Version: 1.0.0\nBuild: 2024.12.15\n\nBPay is a secure crypto-to-cash trading platform serving Nigeria and Kenya.\n\nSupported Countries:\n🇳🇬 Nigeria - Bank Transfer\n🇰🇪 Kenya - M-Pesa & Bank Transfer\n\nSupported Cryptocurrencies:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Tether (USDT)`, [
                  {text: 'Terms of Service', onPress: () => Alert.alert('Terms of Service', 'By using BPay, you agree to our terms and conditions for crypto trading services.')},
                  {text: 'Privacy Policy', onPress: () => Alert.alert('Privacy Policy', 'We protect your personal information and comply with data protection regulations.')},
                  {text: 'Close', style: 'cancel'}
                ]);
              }}
            >
              <Text style={styles.menuItemText}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={() => {
                setShowSideMenu(false);
                handleLogout();
              }}
            >
              <Text style={styles.logoutMenuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
    );
  };

  const TradeScreen = () => (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <View style={styles.tradeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trade Crypto</Text>
        </View>
        
        <ScrollView style={styles.tradeContent}>
          <View style={styles.tradeCard}>
            <Text style={styles.cardTitle}>Quick Trade</Text>
            
            <View style={styles.tradeTypeSelector}>
              <TouchableOpacity 
                style={[styles.tradeTypeButton, tradeType === 'buy' && styles.activeTradeType]}
                onPress={() => setTradeType('buy')}
              >
                <Text style={[styles.tradeTypeText, tradeType !== 'buy' && styles.inactiveTradeType]}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tradeTypeButton, tradeType === 'sell' && styles.activeTradeType]}
                onPress={() => setTradeType('sell')}
              >
                <Text style={[styles.tradeTypeText, tradeType !== 'sell' && styles.inactiveTradeType]}>Sell</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tradeForm}>
              <Text style={styles.inputLabel}>Amount ({selectedCurrency})</Text>
              <TextInput 
                style={styles.tradeInput}
                placeholder="Enter amount"
                value={tradeAmount}
                onChangeText={(text) => {
                  // Allow only numbers and decimal point
                  const numericText = text.replace(/[^0-9.]/g, '');
                  setTradeAmount(numericText);
                }}
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <Text style={styles.inputLabel}>Cryptocurrency</Text>
              <TouchableOpacity 
                style={styles.cryptoSelector}
                onPress={() => {
                  Alert.alert('Select Crypto', 'Choose cryptocurrency', [
                    {text: 'Bitcoin (BTC)', onPress: () => setSelectedCrypto('BTC')},
                    {text: 'Ethereum (ETH)', onPress: () => setSelectedCrypto('ETH')},
                    {text: 'Tether (USDT)', onPress: () => setSelectedCrypto('USDT')},
                    {text: 'Cancel', style: 'cancel'}
                  ]);
                }}
              >
                <Text style={styles.cryptoSelectorText}>{selectedCrypto === 'BTC' ? 'Bitcoin (BTC)' : selectedCrypto === 'ETH' ? 'Ethereum (ETH)' : 'Tether (USDT)'}</Text>
                <Text style={styles.cryptoSelectorArrow}>▼</Text>
              </TouchableOpacity>
              
              <View style={styles.tradePreview}>
                <Text style={styles.previewText}>
                  {tradeType === 'buy' ? 'You will receive:' : 'You will pay:'}
                </Text>
                <Text style={styles.previewAmount}>
                  {tradeAmount ? 
                    tradeType === 'buy' ? 
                      `${(parseFloat(tradeAmount) / rates[selectedCrypto][selectedCurrency]).toFixed(8)} ${selectedCrypto}` :
                      `${getLocalizedContent().symbol}${(parseFloat(tradeAmount) * rates[selectedCrypto][selectedCurrency]).toLocaleString()}`
                    : '0.00'
                  }
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.tradeButton, !tradeAmount && styles.disabledButton]}
                onPress={() => {
                  if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
                    Alert.alert('Error', 'Please enter a valid amount');
                    return;
                  }
                  const cryptoAmount = tradeType === 'buy' ? 
                    parseFloat(tradeAmount) / rates[selectedCrypto][selectedCurrency] :
                    parseFloat(tradeAmount);
                  
                  addTransaction(tradeType, selectedCrypto, parseFloat(tradeAmount), cryptoAmount);
                  
                  Alert.alert(
                    'Trade Created', 
                    `${tradeType === 'buy' ? 'Buy' : 'Sell'} order created successfully!\n\nAmount: ${getLocalizedContent().symbol}${parseFloat(tradeAmount).toLocaleString()}\nCrypto: ${cryptoAmount.toFixed(8)} ${selectedCrypto}\n\nPlease make payment and upload proof.`
                  );
                  
                  setTradeAmount('');
                }}
                disabled={!tradeAmount}
              >
                <Text style={styles.tradeButtonText}>
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.paymentCard}>
            <Text style={styles.cardTitle}>Payment Methods</Text>
            <TouchableOpacity style={styles.paymentMethod}>
              <Text style={styles.paymentMethodText}>{getLocalizedContent().paymentMethod}</Text>
            </TouchableOpacity>
            <View style={styles.localBanks}>
              <Text style={styles.localBanksText}>Popular: {getLocalizedContent().localBank}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const WalletScreen = () => (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet {getLocalizedContent().flag}</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
              <TouchableOpacity 
                style={styles.currencyToggle}
                onPress={() => {
                  const newCountry = userCountry === 'NG' ? 'KE' : 'NG';
                  setUserCountry(newCountry);
                  setSelectedCurrency(newCountry === 'NG' ? 'NGN' : 'KES');
                }}
              >
                <Text style={styles.currencyToggleText}>Tap to switch: {getLocalizedContent().currency}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {getLocalizedContent().symbol}{calculateTotalPortfolio().toLocaleString()}
            </Text>
            <Text style={[styles.portfolioChange, {color: getPortfolioChange() >= 0 ? '#10b981' : '#ef4444'}]}>
              {getPortfolioChange() >= 0 ? '+' : ''}{getPortfolioChange().toFixed(1)}% (24h)
            </Text>
          </View>
          
          <View style={styles.cryptoBalances}>
            <Text style={styles.cardTitle}>Crypto Holdings</Text>
            <View style={styles.cryptoItem}>
              <View style={styles.cryptoLeft}>
                <Image 
                  source={{uri: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'}}
                  style={styles.cryptoImage}
                  defaultSource={require('./assets/images/5782897843587714011_120.jpg')}
                />
                <View>
                  <Text style={styles.cryptoName}>Bitcoin</Text>
                  <Text style={styles.cryptoSymbol}>BTC</Text>
                </View>
              </View>
              <View style={styles.cryptoRight}>
                <Text style={styles.cryptoAmount}>{balance.btc.toFixed(8)} BTC</Text>
                <Text style={styles.cryptoValue}>
                  {getLocalizedContent().symbol}{(balance.btc * rates.BTC[selectedCurrency]).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.cryptoItem}>
              <View style={styles.cryptoLeft}>
                <Image 
                  source={{uri: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'}}
                  style={styles.cryptoImage}
                  defaultSource={require('./assets/images/5782897843587714011_120.jpg')}
                />
                <View>
                  <Text style={styles.cryptoName}>Ethereum</Text>
                  <Text style={styles.cryptoSymbol}>ETH</Text>
                </View>
              </View>
              <View style={styles.cryptoRight}>
                <Text style={styles.cryptoAmount}>{balance.eth.toFixed(8)} ETH</Text>
                <Text style={styles.cryptoValue}>
                  {getLocalizedContent().symbol}{(balance.eth * rates.ETH[selectedCurrency]).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.cryptoItem}>
              <View style={styles.cryptoLeft}>
                <Image 
                  source={{uri: 'https://cryptologos.cc/logos/tether-usdt-logo.png'}}
                  style={styles.cryptoImage}
                  defaultSource={require('./assets/images/5782897843587714011_120.jpg')}
                />
                <View>
                  <Text style={styles.cryptoName}>Tether</Text>
                  <Text style={styles.cryptoSymbol}>USDT</Text>
                </View>
              </View>
              <View style={styles.cryptoRight}>
                <Text style={styles.cryptoAmount}>{balance.usdt.toFixed(2)} USDT</Text>
                <Text style={styles.cryptoValue}>
                  {getLocalizedContent().symbol}{(balance.usdt * rates.USDT[selectedCurrency]).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.walletActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.depositButton]}
              onPress={() => {
                const depositOptions = userCountry === 'KE' ? [
                  {text: 'M-Pesa', onPress: () => Alert.alert('M-Pesa Deposit', 'M-Pesa deposit coming soon')},
                  {text: 'Bank Transfer', onPress: () => Alert.alert('Bank Transfer', 'Bank deposit coming soon')},
                  {text: 'Crypto Deposit', onPress: () => Alert.alert('Crypto Deposit', 'Crypto deposit coming soon')},
                  {text: 'Cancel', style: 'cancel'}
                ] : [
                  {text: 'Bank Transfer', onPress: () => Alert.alert('Bank Transfer', 'Bank deposit coming soon')},
                  {text: 'Crypto Deposit', onPress: () => Alert.alert('Crypto Deposit', 'Crypto deposit coming soon')},
                  {text: 'Cancel', style: 'cancel'}
                ];
                Alert.alert('Deposit', 'Choose deposit method', depositOptions);
              }}
            >
              <Text style={styles.actionButtonText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => {
                const withdrawOptions = userCountry === 'KE' ? [
                  {text: 'M-Pesa', onPress: () => Alert.alert('M-Pesa Withdrawal', 'M-Pesa withdrawal coming soon')},
                  {text: 'Bank Transfer', onPress: () => Alert.alert('Bank Transfer', 'Bank withdrawal coming soon')},
                  {text: 'Crypto Withdrawal', onPress: () => Alert.alert('Crypto Withdrawal', 'Crypto withdrawal coming soon')},
                  {text: 'Cancel', style: 'cancel'}
                ] : [
                  {text: 'Bank Transfer', onPress: () => Alert.alert('Bank Transfer', 'Bank withdrawal coming soon')},
                  {text: 'Crypto Withdrawal', onPress: () => Alert.alert('Crypto Withdrawal', 'Crypto withdrawal coming soon')},
                  {text: 'Cancel', style: 'cancel'}
                ];
                Alert.alert('Withdraw', 'Choose withdrawal method', withdrawOptions);
              }}
            >
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const HistoryScreen = () => (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.historyCard}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Start trading to see your history</Text>
              </View>
            ) : (
              transactions.slice(0, 3).map(tx => (
                <View key={tx.id} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyType}>{tx.type} {tx.crypto}</Text>
                    <Text style={styles.historyDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.historyAmount}>
                    <Text style={styles.historyValue}>{getLocalizedContent().symbol}{tx.amount.toLocaleString()}</Text>
                    <Text style={[styles.historyStatus, tx.status === 'completed' && styles.completedStatus]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  // Error Display Component
  const ErrorDisplay = () => {
    if (!state.error) return null;
    
    return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorBannerText}>{state.error}</Text>
        <TouchableOpacity onPress={clearError}>
          <Text style={styles.errorClose}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.app}>
      <OfflineBanner isOnline={state.isOnline} />
      <ErrorDisplay />
      {!isLoggedIn ? (
        showVerification ? (
          <VerificationForm 
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            handleVerification={handleVerification}
            loading={loading}
            setShowVerification={setShowVerification}
            email={email}
            isForgotPassword={isForgotPassword}
          />
        ) : (
          <LoginForm 
            isSignup={isSignup}
            isForgotPassword={isForgotPassword}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            fullName={fullName}
            loading={loading}
            setEmail={setEmail}
            setPassword={setPassword}
            setConfirmPassword={setConfirmPassword}
            setFullName={setFullName}
            setShowPassword={setShowPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            handleAuth={handleAuth}
            handleForgotPassword={handleForgotPassword}
            setIsForgotPassword={setIsForgotPassword}
            setIsSignup={setIsSignup}
          />
        )
      ) : (
        <>
          {screen === 'dashboard' && <DashboardScreen />}
          {screen === 'trade' && <TradeScreen />}
          {screen === 'wallet' && <WalletScreen />}
          {screen === 'history' && <HistoryScreen />}
        </>
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
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
    paddingTop: Platform.OS === 'ios' ? 44 : 25,
    maxWidth: '100vw',
    alignSelf: 'center',
  },
  
  // Login Screen
  loginContainer: {
    flex: 1,
  },
  loginContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: '#f59e0b',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
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
    marginBottom: 8,
  },
  regions: {
    fontSize: 16,
    color: '#94a3b8',
  },
  loginForm: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 16,
    color: '#64748b',
  },
  
  // New feature styles
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
  },
  themeToggle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
  langToggle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  langText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  socialLogin: {
    marginTop: 20,
    alignItems: 'center',
  },
  orText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  socialText: {
    color: 'white',
    fontSize: 14,
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  verificationText: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // Dashboard Screen
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a365d',
  },
  greeting: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  menuButton: {
    padding: 8,
  },
  menuLines: {
    gap: 3,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: 'white',
  },
  
  // Side menu styles
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sideMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 250,
    height: '100%',
    backgroundColor: 'white',
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a365d',
  },
  logoutMenuItem: {
    backgroundColor: '#fef2f2',
    marginTop: 20,
  },
  logoutMenuText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  
  balanceCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countrySwitch: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countrySwitchText: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  btcBalance: {
    fontSize: 16,
    color: '#f59e0b',
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceAction: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  balanceActionText: {
    fontSize: 16,
    color: '#1a365d',
  },
  
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyCard: {
    backgroundColor: '#10b981',
  },
  sellCard: {
    backgroundColor: '#ef4444',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  ratesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currencyBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
    marginBottom: 8,
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
    color: '#1a365d',
  },
  cryptoFullName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rateRight: {
    alignItems: 'flex-end',
  },
  ratePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  rateChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  ratesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  pulseDot: {
    backgroundColor: '#f59e0b',
  },
  liveText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  
  recentCard: {
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionType: {
    fontSize: 16,
    color: '#64748b',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '600',
  },
  
  // Navigation Bar
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeNavIcon: {
    backgroundColor: '#f59e0b',
  },
  navIconText: {
    fontSize: 16,
    color: '#64748b',
  },
  activeNavIconText: {
    color: 'white',
  },
  navText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  
  // Trade Screen
  tradeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  tradeContent: {
    flex: 1,
    padding: 20,
  },
  tradeCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tradeTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTradeType: {
    backgroundColor: '#10b981',
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  inactiveTradeType: {
    color: '#64748b',
  },
  tradeForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 8,
  },
  tradeInput: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cryptoSelector: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cryptoSelectorText: {
    fontSize: 16,
    color: '#1a365d',
  },
  cryptoSelectorArrow: {
    fontSize: 16,
    color: '#64748b',
  },
  tradePreview: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  tradeButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  paymentCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethod: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1a365d',
  },
  localBanks: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  localBanksText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Wallet Screen
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cryptoBalances: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cryptoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cryptoName: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: '500',
  },
  cryptoAmount: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  depositButton: {
    backgroundColor: '#10b981',
  },
  withdrawButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // History Screen
  historyCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#64748b',
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: 12,
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedStatus: {
    color: '#10b981',
    backgroundColor: '#dcfce7',
  },
  
  // Error handling styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  
  // Offline banner
  offlineBanner: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Error banner
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  errorClose: {
    fontSize: 20,
    color: '#dc2626',
    fontWeight: 'bold',
    paddingLeft: 16,
  },
  
  // Enhanced rates header
  ratesHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 16,
    color: '#64748b',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  
  // Enhanced wallet styles
  currencyToggle: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currencyToggleText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  portfolioChange: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
  },
  cryptoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cryptoRight: {
    alignItems: 'flex-end',
  },
  cryptoValue: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  cryptoSymbol: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  cryptoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rateImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  // Enhanced header styles
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  notificationIcon: {
    fontSize: 4,
    color: 'white',
    lineHeight: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});