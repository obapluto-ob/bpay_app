import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';

// API Configuration
const API_BASE = 'http://localhost:3001/api';

// Simple storage for demo
const storage: { [key: string]: string } = {};

const AsyncStorage = {
  getItem: async (key: string) => {
    try {
      return storage[key] || null;
    } catch (error) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      storage[key] = value;
      return true;
    } catch (error) {
      return false;
    }
  }
};

// API Functions
const api = {
  register: async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  },
  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  },
  resetPassword: async (email: string, securityAnswer: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, securityAnswer, newPassword })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  },
  login: async (credentials: any) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  },
  getRates: async () => {
    try {
      const response = await fetch(`${API_BASE}/trade/rates`);
      return await response.json();
    } catch (error) {
      return {
        BTC: { buy: 45250000, sell: 44750000 },
        ETH: { buy: 2850000, sell: 2820000 },
        USDT: { buy: 1580, sell: 1570 }
      };
    }
  },
  createTrade: async (tradeData: any, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/trade/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tradeData)
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  },
  getTradeHistory: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/trade/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return [];
    }
  }
};

const LoginScreen = ({ isSignup, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, fullName, setFullName, showPassword, setShowPassword, loading, handleAuth, setIsSignup, securityQuestion, setSecurityQuestion, securityAnswer, setSecurityAnswer, setShowForgotPassword }) => (
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
            <Text style={styles.flag}>🇳🇬</Text>
            <Text style={styles.flagText}>Nigeria</Text>
          </View>
          <Text style={styles.flagSeparator}>•</Text>
          <View style={styles.flagItem}>
            <Text style={styles.flag}>🇰🇪</Text>
            <Text style={styles.flagText}>Kenya</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>
        
        {isSignup && (
          <>
            <TextInput 
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
              autoCorrect={false}
            />
            
            <TextInput 
              style={styles.input}
              placeholder="Security Question (e.g., What's your mother's maiden name?)"
              placeholderTextColor="#64748b"
              value={securityQuestion}
              onChangeText={setSecurityQuestion}
              autoCorrect={false}
            />
            
            <TextInput 
              style={styles.input}
              placeholder="Security Answer"
              placeholderTextColor="#64748b"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
              autoCorrect={false}
            />
          </>
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
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        
        {isSignup && (
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
          </Text>
        </TouchableOpacity>
        
        {!isSignup && (
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => setShowForgotPassword(true)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            setIsSignup(!isSignup);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
            setSecurityQuestion('');
            setSecurityAnswer('');
          }}
        >
          <Text style={styles.linkText}>
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [rates, setRates] = useState({ BTC: { buy: 0, sell: 0 }, ETH: { buy: 0, sell: 0 }, USDT: { buy: 0, sell: 0 } });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState({ NGN: 2450000, BTC: 0.04567890, ETH: 0.12345, USDT: 1500 });
  const [showHistory, setShowHistory] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [retrievedQuestion, setRetrievedQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  
  // Fetch real-time rates
  useEffect(() => {
    const fetchRates = async () => {
      const ratesData = await api.getRates();
      setRates(ratesData);
    };
    
    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Load trade history
  useEffect(() => {
    if (isLoggedIn && userToken) {
      loadTradeHistory();
    }
  }, [isLoggedIn, userToken]);
  
  const loadTradeHistory = async () => {
    const history = await api.getTradeHistory(userToken);
    setTrades(history);
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
        if (!securityQuestion || !securityAnswer) {
          Alert.alert('Error', 'Please provide security question and answer');
          setLoading(false);
          return;
        }
        
        const result = await api.register({ email, password, fullName, securityQuestion, securityAnswer });
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          Alert.alert('Success', 'Account created! Please login.');
          setIsSignup(false);
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setSecurityQuestion('');
          setSecurityAnswer('');
        }
      } else {
        const result = await api.login({ email, password });
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setUserToken(result.token);
          await AsyncStorage.setItem('userToken', result.token);
          setIsLoggedIn(true);
          addNotification('Welcome back to BPay!');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
    
    setLoading(false);
  };
  
  const handleForgotPassword = async () => {
    if (forgotStep === 1) {
      if (!forgotEmail) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }
      
      setLoading(true);
      const result = await api.forgotPassword(forgotEmail);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setRetrievedQuestion(result.securityQuestion);
        setForgotStep(2);
      }
      setLoading(false);
    } else if (forgotStep === 2) {
      if (!forgotAnswer || !newPassword) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      
      setLoading(true);
      const result = await api.resetPassword(forgotEmail, forgotAnswer, newPassword);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Password reset successfully!');
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotAnswer('');
        setNewPassword('');
        setRetrievedQuestion('');
      }
      setLoading(false);
    }
  };
  
  const addNotification = (message: string) => {
    const newNotification = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
  };
  
  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    
    const tradeData = {
      type: tradeType,
      crypto: selectedCrypto,
      amount: parseFloat(tradeAmount),
      rate: rates[selectedCrypto][tradeType]
    };
    
    const result = await api.createTrade(tradeData, userToken);
    
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      // Update balance locally
      const cryptoAmount = parseFloat(tradeAmount);
      const ngnAmount = cryptoAmount * rates[selectedCrypto][tradeType];
      
      if (tradeType === 'buy') {
        setBalance(prev => ({
          ...prev,
          NGN: prev.NGN - ngnAmount,
          [selectedCrypto]: prev[selectedCrypto] + cryptoAmount
        }));
        addNotification(`Bought ${cryptoAmount} ${selectedCrypto} for ₦${ngnAmount.toLocaleString()}`);
      } else {
        setBalance(prev => ({
          ...prev,
          NGN: prev.NGN + ngnAmount,
          [selectedCrypto]: prev[selectedCrypto] - cryptoAmount
        }));
        addNotification(`Sold ${cryptoAmount} ${selectedCrypto} for ₦${ngnAmount.toLocaleString()}`);
      }
      
      setShowTradeModal(false);
      setTradeAmount('');
      loadTradeHistory();
      Alert.alert('Success', `Trade completed successfully!`);
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.setItem('userToken', '');
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setUserToken('');
    setTrades([]);
    setNotifications([]);
  };



  const DashboardScreen = () => (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.profileAvatar}>
              <Text style={styles.avatarText}>U</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.headerTitle}>Welcome to Nigeria 🇳🇬</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance (NGN)</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₦2,450,000
          </Text>
          <Text style={styles.btcBalance}>
            0.04567890 BTC ≈ ₦2,400,000
          </Text>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionCard, styles.buyCard]}>
            <Text style={styles.actionTitle}>Buy Crypto</Text>
            <Text style={styles.actionSubtitle}>BTC, ETH, USDT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionCard, styles.sellCard]}>
            <Text style={styles.actionTitle}>Sell Crypto</Text>
            <Text style={styles.actionSubtitle}>Get NGN</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratesCard}>
          <Text style={styles.cardTitle}>Market Rates</Text>
          <View style={styles.ratesList}>
            <View style={styles.rateItem}>
              <View style={styles.rateLeft}>
                <View style={styles.cryptoIcon}>
                  <Text style={styles.cryptoIconText}>B</Text>
                </View>
                <Text style={styles.cryptoName}>BTC</Text>
              </View>
              <Text style={styles.ratePrice}>₦65,000,000</Text>
            </View>
            <View style={styles.rateItem}>
              <View style={styles.rateLeft}>
                <View style={styles.cryptoIcon}>
                  <Text style={styles.cryptoIconText}>E</Text>
                </View>
                <Text style={styles.cryptoName}>ETH</Text>
              </View>
              <Text style={styles.ratePrice}>₦3,950,000</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.app}>
      {!isLoggedIn ? <LoginScreen 
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
        securityQuestion={securityQuestion}
        setSecurityQuestion={setSecurityQuestion}
        securityAnswer={securityAnswer}
        setSecurityAnswer={setSecurityAnswer}
        setShowForgotPassword={setShowForgotPassword}
      /> : <DashboardScreen />}
      
      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.forgotModal}>
            <Text style={styles.forgotTitle}>Reset Password</Text>
            
            {forgotStep === 1 ? (
              <>
                <Text style={styles.forgotStep}>Enter your email</Text>
                <TextInput
                  style={styles.tradeInput}
                  placeholder="Email Address"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={styles.forgotStep}>Answer security question</Text>
                <Text style={styles.forgotQuestion}>{retrievedQuestion}</Text>
                <TextInput
                  style={styles.tradeInput}
                  placeholder="Your Answer"
                  value={forgotAnswer}
                  onChangeText={setForgotAnswer}
                />
                <TextInput
                  style={styles.tradeInput}
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowForgotPassword(false);
                  setForgotStep(1);
                  setForgotEmail('');
                  setForgotAnswer('');
                  setNewPassword('');
                  setRetrievedQuestion('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Processing...' : (forgotStep === 1 ? 'Get Question' : 'Reset Password')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  
  // Crypto Ticker
  cryptoTicker: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tickerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  flag: {
    fontSize: 24,
  },
  flagText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  flagSeparator: {
    color: '#94a3b8',
    fontSize: 16,
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
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#f59e0b',
    fontSize: 14,
    textDecorationLine: 'underline',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a365d',
  },
  headerLeft: {
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
  greeting: {
    fontSize: 16,
    color: '#cbd5e1',
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
  balanceLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  countrySwitch: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countrySwitchText: {
    fontSize: 12,
    color: '#64748b',
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
    color: '#1a365d',
  },
  ratePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  historyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  historyText: {
    color: 'white',
    fontSize: 12,
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
  cryptoBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cryptoBalance: {
    fontSize: 14,
    color: '#64748b',
  },
  rateSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rateRight: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  cryptoSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  cryptoOption: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  selectedCrypto: {
    backgroundColor: '#f59e0b',
  },
  cryptoOptionText: {
    fontWeight: 'bold',
  },
  rateDisplay: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    color: '#64748b',
  },
  tradeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  tradePreview: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  historyModal: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 44 : 25,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyList: {
    flex: 1,
    padding: 20,
  },
  noTrades: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    marginTop: 50,
  },
  tradeItem: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  tradeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  tradeAmount: {
    fontSize: 14,
    color: '#64748b',
  },
  tradeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  tradeDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1a365d',
  },
  securityQuestionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    color: '#1a365d',
    fontWeight: '500',
  },
  forgotModal: {
    backgroundColor: 'white',
    margin: 30,
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1a365d',
  },
  forgotStep: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#64748b',
  },
  forgotQuestion: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    color: '#1a365d',
  },
});