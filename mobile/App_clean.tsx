import React, { useState, useEffect, useCallback, createContext, useContext, useReducer } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Import web styles for mobile-like scrollbar
if (Platform.OS === 'web') {
  require('./web-styles.css');
}

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

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.securityBadge}>
              <Text style={styles.securityText}>256-bit SSL</Text>
            </View>
          </View>
          <Text style={styles.featureSeparator}>•</Text>
          <View style={styles.featureItem}>
            <View style={styles.kycBadge}>
              <Text style={styles.kycText}>KYC Verified</Text>
            </View>
          </View>
          <Text style={styles.featureSeparator}>•</Text>
          <View style={styles.featureItem}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>Live Rates</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.loginForm}>
        <Text style={styles.formTitle}>
          {isForgotPassword ? 'Reset Password' : (isSignup ? 'Create Account' : 'Welcome Back')}
        </Text>
        
        {isSignup && (
          <>
            <TextInput 
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput 
              style={styles.input}
              placeholder="Security Question: What's your mother's maiden name?"
              placeholderTextColor="#64748b"
              value={securityQuestion}
              onChangeText={setSecurityQuestion}
            />
            <TextInput 
              style={styles.input}
              placeholder="Security Answer"
              placeholderTextColor="#64748b"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
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
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁🗨'}</Text>
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
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁' : '👁🗨'}</Text>
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
          <View style={styles.trustSection}>
            <Text style={styles.trustText}>🔐 Bank-level security • ⚡ Instant trades • 🏆 50K+ users</Text>
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
        
        {email === 'admin@bpay.com' && (
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => {
              if (password === 'admin123') {
                Alert.alert('Admin Panel', 'Features:\n• Approve/Reject trades\n• Manage users\n• View analytics\n• System settings');
              } else {
                Alert.alert('Admin Access', 'Enter admin password to continue');
              }
            }}
          >
            <Text style={styles.adminButtonText}>Admin Panel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

// Rest of the component code remains the same...
// [The rest of the file would continue with all the other components and styles]

const styles = StyleSheet.create({
  // Trust section
  trustSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  trustText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  // ... all other styles remain the same
});