import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Clipboard, Image } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { DepositMethod } from '../types';

interface Props {
  userCountry: 'NG' | 'KE';
  onClose: () => void;
  onSuccess: () => void;
}

const depositMethods: DepositMethod[] = [
  {
    id: 'ng_bank',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    details: 'Transfer to our Nigerian bank account',
    country: 'NG',
    instructions: [
      'Transfer money to the account details below',
      'Use your email as the transfer reference',
      'Upload proof of payment',
      'Funds will be credited within 30 minutes after verification'
    ]
  },
  {
    id: 'ke_bank',
    type: 'bank_transfer', 
    name: 'Bank Transfer',
    details: 'Transfer to our Kenyan bank account',
    country: 'KE',
    instructions: [
      'Transfer money to the account details below',
      'Use your email as the transfer reference', 
      'Upload proof of payment',
      'Funds will be credited within 30 minutes after verification'
    ]
  },
  {
    id: 'ke_mpesa',
    type: 'mobile_money',
    name: 'M-Pesa',
    details: 'Send money via M-Pesa',
    country: 'KE',
    instructions: [
      'Go to M-Pesa menu on your phone',
      'Select Send Money (Lipa na M-Pesa)',
      'Enter the Paybill number below',
      'Use your email as the account number',
      'Upload M-Pesa confirmation message'
    ]
  }
];

const bankDetails = {
  NG: {
    accountName: 'BPay Technologies Ltd',
    accountNumber: '0123456789',
    bankName: 'First Bank of Nigeria',
    sortCode: '011151003'
  },
  KE: {
    accountName: 'BPay Kenya Ltd',
    accountNumber: '0987654321', 
    bankName: 'Equity Bank Kenya',
    branchCode: '068'
  }
};

const mpesaDetails = {
  paybill: '522522',
  businessName: 'BPay Kenya'
};

export const DepositScreen: React.FC<Props> = ({ userCountry, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const availableMethods = depositMethods.filter(method => method.country === userCountry);
  const currency = userCountry === 'NG' ? '₦' : 'KSh';
  const currencyName = userCountry === 'NG' ? 'Naira' : 'Shillings';

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const handleImagePicker = (type: 'camera' | 'library') => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    const callback = (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      
      if (response.assets && response.assets[0]) {
        setUploadedImage(response.assets[0].uri || null);
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const handleSubmitProof = () => {
    if (!amount || (!paymentReference && !uploadedImage)) {
      Alert.alert('Error', 'Please fill amount and provide either payment reference or upload receipt image');
      return;
    }
    
    Alert.alert(
      'Deposit Submitted',
      `Your deposit of ${currency}${amount} has been submitted for verification. You will be notified once processed.`,
      [{ text: 'OK', onPress: onSuccess }]
    );
  };

  if (!selectedMethod) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Deposit {currencyName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>Choose your preferred deposit method:</Text>
          
          {availableMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.methodCard}
              onPress={() => setSelectedMethod(method)}
            >
              <View style={[styles.methodIcon, 
                method.type === 'bank_transfer' && styles.bankIcon,
                method.type === 'mobile_money' && styles.mobileIcon
              ]}>
                {method.type === 'bank_transfer' ? (
                  <View style={styles.bankIconContainer}>
                    <View style={styles.bankBuilding} />
                    <View style={styles.bankPillar1} />
                    <View style={styles.bankPillar2} />
                    <View style={styles.bankPillar3} />
                    <View style={styles.bankRoof} />
                  </View>
                ) : (
                  <View style={styles.phoneIconContainer}>
                    <View style={styles.phoneBody} />
                    <View style={styles.phoneScreen} />
                    <View style={styles.phoneButton} />
                    <View style={styles.waveSignal1} />
                    <View style={styles.waveSignal2} />
                  </View>
                )}
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDetails}>{method.details}</Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.infoCard}>
            <View style={styles.lightbulbIcon}>
              <View style={styles.bulbTop} />
              <View style={styles.bulbBase} />
              <View style={styles.bulbGlow} />
            </View>
            <Text style={styles.infoTitle}>Important Notes</Text>
            <Text style={styles.infoText}>• Minimum deposit: {currency}1,000</Text>
            <Text style={styles.infoText}>• Processing time: 30 minutes - 2 hours</Text>
            <Text style={styles.infoText}>• Always use your registered email as reference</Text>
            <Text style={styles.infoText}>• Keep your payment receipt for verification</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedMethod.name}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!showUpload ? (
          <>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              {selectedMethod.instructions.map((instruction, index) => (
                <Text key={index} style={styles.instructionText}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>

            {selectedMethod.type === 'bank_transfer' && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Bank Account Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Name:</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(bankDetails[userCountry].accountName, 'Account name')}>
                    <Text style={styles.detailValue}>{bankDetails[userCountry].accountName} 📋</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number:</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(bankDetails[userCountry].accountNumber, 'Account number')}>
                    <Text style={styles.detailValue}>{bankDetails[userCountry].accountNumber} 📋</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bank Name:</Text>
                  <Text style={styles.detailValue}>{bankDetails[userCountry].bankName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{userCountry === 'NG' ? 'Sort Code:' : 'Branch Code:'}</Text>
                  <Text style={styles.detailValue}>
                    {userCountry === 'NG' ? bankDetails.NG.sortCode : bankDetails.KE.branchCode}
                  </Text>
                </View>
              </View>
            )}

            {selectedMethod.type === 'mobile_money' && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>M-Pesa Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paybill Number:</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(mpesaDetails.paybill, 'Paybill number')}>
                    <Text style={styles.detailValue}>{mpesaDetails.paybill} 📋</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name:</Text>
                  <Text style={styles.detailValue}>{mpesaDetails.businessName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number:</Text>
                  <Text style={styles.detailValue}>Your registered email</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => setShowUpload(true)}
            >
              <Text style={styles.continueButtonText}>I've Made the Payment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>Upload Payment Proof</Text>
              
              <Text style={styles.fieldLabel}>Amount Deposited</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter amount in ${currencyName}`}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              
              <Text style={styles.fieldLabel}>Payment Reference (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Transaction reference, receipt number, or M-Pesa confirmation code"
                value={paymentReference}
                onChangeText={setPaymentReference}
              />
              
              <Text style={styles.fieldLabel}>Upload Receipt Image</Text>
              {!uploadedImage ? (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={() => handleImagePicker('camera')}
                  >
                    <Text style={styles.uploadButtonText}>📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={() => handleImagePicker('library')}
                  >
                    <Text style={styles.uploadButtonText}>📁 Choose File</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: uploadedImage }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setUploadedImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitProof}
            >
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 80,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#64748b',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  bankIcon: {
    backgroundColor: '#dbeafe',
  },
  mobileIcon: {
    backgroundColor: '#dcfce7',
  },
  bankIconContainer: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  bankBuilding: {
    width: 20,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 4,
  },
  bankPillar1: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    left: 6,
  },
  bankPillar2: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    left: 12,
  },
  bankPillar3: {
    width: 3,
    height: 12,
    backgroundColor: '#1e40af',
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  bankRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1e40af',
    position: 'absolute',
    top: 0,
    left: -4,
  },
  phoneIconContainer: {
    width: 24,
    height: 28,
    position: 'relative',
  },
  phoneBody: {
    width: 16,
    height: 24,
    backgroundColor: '#16a34a',
    borderRadius: 4,
    position: 'absolute',
    left: 4,
    top: 2,
  },
  phoneScreen: {
    width: 12,
    height: 16,
    backgroundColor: '#22c55e',
    borderRadius: 2,
    position: 'absolute',
    left: 6,
    top: 4,
  },
  phoneButton: {
    width: 4,
    height: 2,
    backgroundColor: '#15803d',
    borderRadius: 1,
    position: 'absolute',
    left: 10,
    bottom: 4,
  },
  waveSignal1: {
    width: 6,
    height: 2,
    backgroundColor: '#22c55e',
    borderRadius: 1,
    position: 'absolute',
    right: -2,
    top: 8,
  },
  waveSignal2: {
    width: 4,
    height: 2,
    backgroundColor: '#22c55e',
    borderRadius: 1,
    position: 'absolute',
    right: -1,
    top: 12,
  },
  lightbulbIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    marginRight: 8,
  },
  bulbTop: {
    width: 12,
    height: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    position: 'absolute',
    left: 4,
    top: 0,
  },
  bulbBase: {
    width: 8,
    height: 6,
    backgroundColor: '#92400e',
    borderRadius: 2,
    position: 'absolute',
    left: 6,
    bottom: 0,
  },
  bulbGlow: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    position: 'absolute',
    left: 2,
    top: -2,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  methodArrow: {
    fontSize: 20,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
  instructionsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeImageButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});