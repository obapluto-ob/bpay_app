import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rates, setRates] = useState({
    BTC: { buy: 0, sell: 0 },
    ETH: { buy: 0, sell: 0 },
    USDT: { buy: 0, sell: 0 }
  });

  useEffect(() => {
    // Fetch rates
    setRates({
      BTC: { buy: 45250000, sell: 44750000 },
      ETH: { buy: 2850000, sell: 2820000 },
      USDT: { buy: 1580, sell: 1570 }
    });
  }, []);

  const handleLogin = () => {
    navigation.navigate('Dashboard');
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    alert('Forgot password feature coming soon');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Rates Section */}
      <View style={styles.ratesContainer}>
        <Text style={styles.ratesTitle}>Live Rates (NGN)</Text>
        <View style={styles.ratesGrid}>
          {Object.entries(rates).map(([coin, rate]) => (
            <View key={coin} style={styles.rateCard}>
              <Text style={styles.coinName}>{coin}</Text>
              <Text style={styles.rateText}>Buy: ₦{rate.buy.toLocaleString()}</Text>
              <Text style={styles.rateText}>Sell: ₦{rate.sell.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Login Form */}
      <Card style={styles.loginCard}>
        <Card.Content>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.loginButton}
          >
            Sign In
          </Button>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  ratesContainer: {
    backgroundColor: '#f97316',
    padding: 20,
    paddingTop: 50,
  },
  ratesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  ratesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  coinName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  rateText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  loginCard: {
    margin: 20,
    marginTop: -10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#f97316',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 20,
    backgroundColor: '#f97316',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#f97316',
    fontWeight: 'bold',
  },
});