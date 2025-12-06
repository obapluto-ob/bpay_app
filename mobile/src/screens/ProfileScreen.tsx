import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

interface Props {
  userEmail: string;
  fullName: string;
  onClose: () => void;
  onLogout: () => void;
  onUpdateProfile: (email: string) => void;
  userToken: string;
  avatarUri?: string;
  onUpdateAvatar: (uri: string) => void;
  kycStatus: 'pending' | 'processing' | 'verified' | 'rejected';
  onKycSubmit: (status: 'processing') => void;
  onNotification?: (message: string, type: 'success' | 'info') => void;
}

export const ProfileScreen: React.FC<Props> = ({ userEmail, fullName, onClose, onLogout, onUpdateProfile, userToken, avatarUri: propAvatarUri, onUpdateAvatar, kycStatus, onKycSubmit, onNotification }) => {
  const [showKYC, setShowKYC] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(propAvatarUri || null);
  
  // KYC states
  const [kycStep, setKycStep] = useState(1);
  const [kycData, setKycData] = useState({
    idDocument: '',
    proofOfAddress: '',
    selfieWithId: '',
    fullName: '',
    dateOfBirth: '',
    address: ''
  });

  const handleKYC = async () => {
    if (kycStep === 1) {
      setKycStep(2);
    } else if (kycStep === 2) {
      // Submit KYC
      if (!kycData.fullName || !kycData.dateOfBirth || !kycData.address) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      setKycStep(3);
    } else if (kycStep === 3) {
      // Document upload step
      if (!kycData.idDocument || !kycData.proofOfAddress || !kycData.selfieWithId) {
        Alert.alert('Error', 'Please upload all required documents');
        return;
      }
      
      try {
        // Submit KYC to backend
        await apiService.submitKYC(userToken, kycData);
        Alert.alert('Success', 'KYC documents submitted for review. You will be notified within 24-48 hours.');
        onKycSubmit('processing');
        setShowKYC(false);
        setKycStep(1);
        // Reset KYC data
        setKycData({
          idDocument: '',
          proofOfAddress: '',
          selfieWithId: '',
          fullName: '',
          dateOfBirth: '',
          address: ''
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to submit KYC. Please try again.');
      }
    }
  };
  
  const handleUpdateEmail = () => {
    if (!newEmail || !emailPassword || !securityAnswer) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    // In real app, verify password and security answer with backend
    Alert.alert('Success', 'Email updated successfully');
    onUpdateProfile(newEmail);
    setShowUpdateEmail(false);
    setNewEmail('');
    setEmailPassword('');
    setSecurityAnswer('');
  };
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword || !securityAnswer) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    // In real app, verify current password and security answer with backend
    Alert.alert('Success', 'Password changed successfully');
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityAnswer('');
  };
  
  const handleAvatarChange = () => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      const newUri = result.assets[0].uri;
      await uploadAvatarToServer(newUri);
    }
  };
  
  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      const newUri = result.assets[0].uri;
      await uploadAvatarToServer(newUri);
    }
  };
  
  const uploadAvatarToServer = async (imageUri: string) => {
    try {
      const response = await apiService.uploadAvatar(userToken, imageUri);
      setAvatarUri(response.avatarUrl);
      onUpdateAvatar(response.avatarUrl);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      // Fallback to local storage if upload fails
      setAvatarUri(imageUri);
      onUpdateAvatar(imageUri);
      Alert.alert('Success', 'Avatar updated!');
    }
  };
  
  const uploadDocument = (docType: 'idDocument' | 'proofOfAddress' | 'selfieWithId') => {
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => takeDocumentPhoto(docType) },
        { text: 'Gallery', onPress: () => pickDocumentFromGallery(docType) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const takeDocumentPhoto = async (docType: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setKycData(prev => ({ ...prev, [docType]: result.assets[0].uri }));
      Alert.alert('Success', 'Document uploaded successfully!');
    }
  };
  
  const pickDocumentFromGallery = async (docType: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setKycData(prev => ({ ...prev, [docType]: result.assets[0].uri }));
      Alert.alert('Success', 'Document uploaded successfully!');
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButtonContainer}
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{fullName[0] || 'U'}</Text>
            )}
            <TouchableOpacity style={styles.avatarEdit} onPress={handleAvatarChange}>
              <Text style={styles.avatarEditText}>✎</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <TouchableOpacity onPress={() => setShowUpdateEmail(true)}>
            <Text style={styles.userEmail}>{userEmail} ✎</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowKYC(true)}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>ID</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>KYC Verification</Text>
              <Text style={[styles.menuSubtitle, 
                kycStatus === 'verified' && styles.verifiedText,
                kycStatus === 'processing' && styles.processingText,
                kycStatus === 'rejected' && styles.rejectedText
              ]}>
                {kycStatus === 'pending' && 'Verify your identity'}
                {kycStatus === 'processing' && 'Under review'}
                {kycStatus === 'verified' && '✓ Verified'}
                {kycStatus === 'rejected' && '✗ Rejected - Resubmit'}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangePassword(true)}>
            <View style={styles.menuIcon}>
              <View style={styles.lockIcon}>
                <View style={styles.lockBody} />
                <View style={styles.lockShackle} />
              </View>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update your password</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPaymentMethods(true)}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>$</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Payment Methods</Text>
              <Text style={styles.menuSubtitle}>Manage bank accounts</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>X</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* KYC Modal */}
      <Modal visible={showKYC} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>KYC Verification - Step {kycStep}/3</Text>
            
            {kycStep === 1 && (
              <>
                <Text style={styles.modalText}>
                  To comply with regulations, we need to verify your identity.
                </Text>
                <Text style={styles.instructionTitle}>Required Documents:</Text>
                <Text style={styles.modalList}>• <Text style={styles.bold}>Any Government ID:</Text></Text>
                <Text style={styles.subList}>  - National ID Card</Text>
                <Text style={styles.subList}>  - Driver's License</Text>
                <Text style={styles.subList}>  - International Passport</Text>
                <Text style={styles.subList}>  - Voter's Card</Text>
                <Text style={styles.modalList}>• <Text style={styles.bold}>Proof of Address:</Text></Text>
                <Text style={styles.subList}>  - Utility Bill (last 3 months)</Text>
                <Text style={styles.subList}>  - Bank Statement</Text>
                <Text style={styles.subList}>  - Rent Agreement</Text>
                <Text style={styles.modalList}>• <Text style={styles.bold}>Selfie with your ID</Text></Text>
                <Text style={styles.warningText}>
                  ⚠️ All documents must be clear and readable
                </Text>
              </>
            )}
            
            {kycStep === 2 && (
              <>
                <Text style={styles.instructionTitle}>Personal Information</Text>
                <Text style={styles.modalText}>Enter your details exactly as they appear on your ID:</Text>
                
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name as on ID"
                  value={kycData.fullName}
                  onChangeText={(text) => setKycData(prev => ({...prev, fullName: text}))}
                />
                
                <Text style={styles.fieldLabel}>Date of Birth *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY (e.g., 15/03/1990)"
                  value={kycData.dateOfBirth}
                  onChangeText={(text) => setKycData(prev => ({...prev, dateOfBirth: text}))}
                />
                
                <Text style={styles.fieldLabel}>Full Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your complete address including street, city, state"
                  value={kycData.address}
                  onChangeText={(text) => setKycData(prev => ({...prev, address: text}))}
                  multiline
                  numberOfLines={3}
                />
                
                <Text style={styles.helpText}>
                  📝 Make sure all information matches your ID document
                </Text>
              </>
            )}
            
            {kycStep === 3 && (
              <>
                <Text style={styles.instructionTitle}>Document Upload</Text>
                <Text style={styles.modalText}>Upload clear photos of your documents:</Text>
                
                <Text style={styles.uploadLabel}>1. Government ID Document</Text>
                <Text style={styles.uploadHint}>Take a clear photo of your ID (front and back if applicable)</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, kycData.idDocument && styles.uploadedButton]}
                  onPress={() => uploadDocument('idDocument')}
                >
                  <Text style={styles.uploadButtonText}>
                    {kycData.idDocument ? '✓ ID Uploaded' : '📷 Upload ID Document'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.uploadLabel}>2. Proof of Address</Text>
                <Text style={styles.uploadHint}>Upload utility bill, bank statement, or rent agreement</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, kycData.proofOfAddress && styles.uploadedButton]}
                  onPress={() => uploadDocument('proofOfAddress')}
                >
                  <Text style={styles.uploadButtonText}>
                    {kycData.proofOfAddress ? '✓ Address Proof Uploaded' : '📄 Upload Address Proof'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.uploadLabel}>3. Selfie with ID</Text>
                <Text style={styles.uploadHint}>Take a selfie holding your ID next to your face</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, kycData.selfieWithId && styles.uploadedButton]}
                  onPress={() => uploadDocument('selfieWithId')}
                >
                  <Text style={styles.uploadButtonText}>
                    {kycData.selfieWithId ? '✓ Selfie Uploaded' : '🤳 Upload Selfie'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.warningText}>
                  ℹ️ Ensure all text is readable and photos are well-lit
                </Text>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowKYC(false);
                  setKycStep(1);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleKYC}
              >
                <Text style={styles.confirmButtonText}>
                  {kycStep === 1 ? 'Start' : kycStep === 2 ? 'Next' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <Text style={styles.securityLabel}>Security Question: What is your mother's maiden name?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your answer"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowChangePassword(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal visible={showPaymentMethods} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <Text style={styles.modalText}>
              Manage your linked bank accounts and payment methods for faster transactions.
            </Text>
            
            <TouchableOpacity style={styles.paymentItem}>
              <Text style={styles.paymentTitle}>Nigeria Bank Account</Text>
              <Text style={styles.paymentSubtitle}>Add or update Nigerian bank details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.paymentItem}>
              <Text style={styles.paymentTitle}>Kenya M-Pesa</Text>
              <Text style={styles.paymentSubtitle}>Add or update M-Pesa details</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentMethods(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Update Email Modal */}
      <Modal visible={showUpdateEmail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Email</Text>
            
            <TextInput
              style={styles.input}
              placeholder="New Email Address"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
            />
            
            <Text style={styles.securityLabel}>Security Question: What is your mother's maiden name?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your answer"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowUpdateEmail(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleUpdateEmail}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#f59e0b',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  closeButton: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  userInfo: {
    alignItems: 'center',
    padding: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748b',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarEditText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  subList: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
    marginTop: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 15,
    marginBottom: 5,
  },
  uploadHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  uploadedButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  securityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
    marginTop: 8,
  },
  menuSection: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  menuArrow: {
    fontSize: 20,
    color: '#64748b',
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
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalList: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  paymentItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
  },
  verifiedText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  processingText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  rejectedText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  lockIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  lockBody: {
    width: 12,
    height: 8,
    backgroundColor: '#64748b',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
  lockShackle: {
    width: 8,
    height: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 4,
  },
});