import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
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
});