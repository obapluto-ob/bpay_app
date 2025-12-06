import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

interface Props {
  onAdminLogin: (adminData: AdminUser) => void;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin';
  permissions: string[];
  assignedRegion?: 'NG' | 'KE' | 'ALL';
}

export const AdminLoginScreen: React.FC<Props> = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock admin accounts
  const mockAdmins: AdminUser[] = [
    {
      id: 'admin_001',
      name: 'John Doe',
      email: 'john@bpay.com',
      role: 'super_admin',
      permissions: ['all'],
      assignedRegion: 'ALL'
    },
    {
      id: 'admin_002', 
      name: 'Sarah Nigeria',
      email: 'sarah@bpay.com',
      role: 'trade_admin',
      permissions: ['approve_trades', 'reject_trades', 'view_users'],
      assignedRegion: 'NG'
    },
    {
      id: 'admin_003',
      name: 'David Kenya', 
      email: 'david@bpay.com',
      role: 'trade_admin',
      permissions: ['approve_trades', 'reject_trades', 'view_users'],
      assignedRegion: 'KE'
    },
    {
      id: 'admin_004',
      name: 'Rate Manager',
      email: 'rates@bpay.com', 
      role: 'rate_admin',
      permissions: ['manage_rates', 'set_alerts', 'view_analytics'],
      assignedRegion: 'ALL'
    }
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const admin = mockAdmins.find(a => a.email === email);
      
      if (admin && password === 'admin123') {
        onAdminLogin(admin);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BPay Admin Panel</Text>
        <Text style={styles.subtitle}>Secure Admin Access</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Admin Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Authenticating...' : 'Admin Login'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testAccounts}>
        <Text style={styles.testTitle}>Test Accounts:</Text>
        <Text style={styles.testAccount}>Super Admin: john@bpay.com</Text>
        <Text style={styles.testAccount}>Nigeria Admin: sarah@bpay.com</Text>
        <Text style={styles.testAccount}>Kenya Admin: david@bpay.com</Text>
        <Text style={styles.testAccount}>Rate Admin: rates@bpay.com</Text>
        <Text style={styles.testPassword}>Password: admin123</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#f59e0b',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testAccounts: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
  },
  testTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testAccount: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  testPassword: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
});