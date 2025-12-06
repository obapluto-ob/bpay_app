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
    confirmPassword: '',
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: ''
  });

  const securityQuestions = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the name of your first school?",
    "What is your favorite food?",
    "What was your childhood nickname?"
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle registration logic
    navigation.navigate('Dashboard');
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.registerCard}>
        <Card.Content>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join BPay today</Text>
          
          <View style={styles.nameRow}>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
          </View>
          
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          
          <View style={styles.countryContainer}>
            <Text style={styles.countryLabel}>Country</Text>
            <View style={styles.countryButtons}>
              <TouchableOpacity 
                style={[styles.countryButton, formData.country === 'NG' && styles.selectedCountry]}
                onPress={() => updateField('country', 'NG')}
              >
                <Text style={[styles.countryText, formData.country === 'NG' && styles.selectedCountryText]}>🇳🇬 Nigeria</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.countryButton, formData.country === 'KE' && styles.selectedCountry]}
                onPress={() => updateField('country', 'KE')}
              >
                <Text style={[styles.countryText, formData.country === 'KE' && styles.selectedCountryText]}>🇰🇪 Kenya</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
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
          
          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon 
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          
          <Text style={styles.sectionTitle}>Security Questions</Text>
          <Text style={styles.sectionSubtitle}>Answer these questions for account recovery</Text>
          
          <Text style={styles.questionText}>What was the name of your first pet?</Text>
          <TextInput
            label="Your Answer"
            value={formData.securityAnswer1}
            onChangeText={(value) => updateField('securityAnswer1', value)}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your answer"
          />
          
          <Text style={styles.questionText}>What is your mother's maiden name?</Text>
          <TextInput
            label="Your Answer"
            value={formData.securityAnswer2}
            onChangeText={(value) => updateField('securityAnswer2', value)}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your answer"
          />
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.registerButton}
          >
            Create Account
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  registerCard: {
    margin: 20,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  registerButton: {
    marginBottom: 20,
    backgroundColor: '#f97316',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#f97316',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    minHeight: 50,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flexWrap: 'wrap',
  },
  questionOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  questionOptionText: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  countryContainer: {
    marginBottom: 15,
  },
  countryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  countryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  countryButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  selectedCountry: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  countryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCountryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});