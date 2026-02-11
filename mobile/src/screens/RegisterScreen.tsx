import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'NG',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      const response = await fetch(`https://bpay-app.onrender.com/api/auth/check-email?email=${email}`);
      const data = await response.json();
      
      if (data.exists) {
        setEmailError('⚠️ This email is already registered');
      } else {
        setEmailError('');
      }
    } catch (err) {
      setEmailError('');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'email' && value.includes('@')) {
      checkEmailExists(value);
    }
  };

  const handleRegister = async () => {
    setError('');
    
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your first and last name');
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (emailError) {
      setError('Please use a different email address');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://bpay-app.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: `${formData.firstName} ${formData.lastName}`,
          country: formData.country
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate('Dashboard');
      } else {
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError('Network error: ' + (err.message || 'Check your connection'));
    } finally {
      setLoading(false);
    }
  };

  const isNamesFilled = formData.firstName && formData.lastName;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.registerCard}>
        <Card.Content>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join BPay today</Text>
          
          <View style={styles.nameRow}>
            <TextInput
              label="First Name *"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              label="Last Name *"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
          </View>
          
          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={!isNamesFilled}
            error={!!emailError}
          />
          {emailError ? <Text style={styles.emailError}>{emailError}</Text> : null}
          
          <TextInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            disabled={!isNamesFilled}
          />
          
          <View style={styles.countryContainer}>
            <Text style={styles.countryLabel}>Country</Text>
            <View style={styles.countryButtons}>
              <TouchableOpacity 
                style={[styles.countryButton, formData.country === 'NG' && styles.selectedCountry]}
                onPress={() => updateField('country', 'NG')}
                disabled={!isNamesFilled}
              >
                <Text style={[styles.countryText, formData.country === 'NG' && styles.selectedCountryText]}>🇳🇬 Nigeria</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.countryButton, formData.country === 'KE' && styles.selectedCountry]}
                onPress={() => updateField('country', 'KE')}
                disabled={!isNamesFilled}
              >
                <Text style={[styles.countryText, formData.country === 'KE' && styles.selectedCountryText]}>🇰🇪 Kenya</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TextInput
            label="Password *"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            disabled={!isNamesFilled}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          
          <TextInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            disabled={!isNamesFilled}
            right={
              <TextInput.Icon 
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.registerButton}
            loading={loading}
            disabled={loading || !isNamesFilled || !!emailError}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  registerCard: { margin: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { marginBottom: 15 },
  halfInput: { width: '48%' },
  registerButton: { marginBottom: 20, backgroundColor: '#f97316' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#666' },
  loginLink: { color: '#f97316', fontWeight: 'bold' },
  countryContainer: { marginBottom: 15 },
  countryLabel: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#333' },
  countryButtons: { flexDirection: 'row', gap: 10 },
  countryButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#f9f9f9' },
  selectedCountry: { backgroundColor: '#f97316', borderColor: '#f97316' },
  countryText: { fontSize: 14, color: '#333' },
  selectedCountryText: { color: 'white', fontWeight: 'bold' },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '500' },
  emailError: { color: '#dc2626', fontSize: 12, marginTop: -10, marginBottom: 10 }
});