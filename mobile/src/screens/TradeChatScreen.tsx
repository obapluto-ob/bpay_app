import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Image } from 'react-native';
import { useChat } from '../hooks/useChat';
import { DepositSuccessScreen } from './DepositSuccessScreen';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
}

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  crypto: string;
  amount: number;
  fiatAmount: number;
  currency: string;
  status: string;
  assignedAdmin?: string;
  adminName?: string;
  adminRating?: number;
  chatMessages: ChatMessage[];
}

interface TradeChatScreenProps {
  trade: Trade;
  userToken: string;
  onClose: () => void;
  onRateAdmin: (rating: number) => void;
  onRaiseDispute: (reason: string) => void;
  onTradeComplete?: (status: 'approved' | 'declined', message: string) => void;
}

export const TradeChatScreen: React.FC<TradeChatScreenProps> = ({
  trade,
  userToken,
  onClose,
  onRateAdmin,
  onRaiseDispute,
  onTradeComplete
}) => {
  const { messages, sendMessage, isConnected, isLoading } = useChat(trade.id, userToken);
  const [newMessage, setNewMessage] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [rating, setRating] = useState(0);
  const [disputeReason, setDisputeReason] = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Listen for admin approval/decline messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.senderType === 'admin') {
      const msg = lastMessage.message.toLowerCase();
      if (msg.includes('credited') || msg.includes('approved') || msg.includes('confirmed')) {
        // Show success screen immediately
        setShowSuccess(true);
      }
    }
  }, [messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleMarkPaid = async () => {
    const paidMessage = `I have completed the payment for Order #${trade.id}. Uploading proof now...`;
    sendMessage(paidMessage);
    setHasPaid(true);
  };

  const selectPaymentProof = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      setUploadingProof(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentProof(result.assets[0].uri);
        
        // Upload proof
        await fetch(`https://bpay-app.onrender.com/api/trade/${trade.id}/proof`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ proof: result.assets[0].uri })
        });
        
        // Send message with proof
        sendMessage('Payment proof uploaded. Please verify and credit my account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload proof. Please try again.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    try {
      // Update trade status
      await fetch(`https://bpay-app.onrender.com/api/trade/${trade.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      // Send cancellation message
      sendMessage(`Order cancelled by user. Reason: ${cancelReason}`);
      
      setShowCancelModal(false);
      Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessage(newMessage);
    setNewMessage('');
  };

  const submitRating = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    onRateAdmin(rating);
    setShowRating(false);
    Alert.alert('Success', 'Thank you for your feedback!');
  };

  const submitDispute = () => {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the dispute');
      return;
    }
    onRaiseDispute(disputeReason);
    setShowDispute(false);
    Alert.alert('Dispute Raised', 'Your dispute has been submitted and will be reviewed by our team.');
  };

  const getStatusColor = () => {
    switch (trade.status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'disputed': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Trade Chat</Text>
          <Text style={styles.headerSubtitle}>
            {trade.type.toUpperCase()} {trade.amount} {trade.crypto}
          </Text>
          <Text style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{trade.status}</Text>
        </View>
      </View>

      {/* Trade Info */}
      <View style={styles.tradeInfo}>
        <View style={styles.tradeDetails}>
          <Text style={styles.tradeAmount}>
            {trade.currency} {trade.fiatAmount.toLocaleString()}
          </Text>
          <Text style={styles.tradeRate}>
            Rate: {(trade.fiatAmount / trade.amount).toLocaleString()} {trade.currency}/{trade.crypto}
          </Text>
        </View>
        {trade.assignedAdmin && (
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{trade.adminName || 'Admin'}</Text>
            {trade.adminRating && (
              <Text style={styles.adminRating}>★ {trade.adminRating.toFixed(1)}</Text>
            )}
          </View>
        )}
      </View>

      {/* Chat Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.senderType === 'user' ? styles.userMessage : styles.adminMessage,
              message.type === 'system' && styles.systemMessage
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.senderType === 'user' ? styles.userBubble : styles.adminBubble,
              message.type === 'system' && styles.systemBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.senderType === 'user' ? styles.userText : styles.adminText,
                message.type === 'system' && styles.systemText
              ]}>
                {message.message}
              </Text>
              <Text style={[
                styles.messageTime,
                message.senderType === 'user' ? styles.userTime : styles.adminTime
              ]}>
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !isConnected && styles.disconnectedButton]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendText}>{isConnected ? 'Send' : 'Offline'}</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!hasPaid && trade.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={styles.paidButton}
              onPress={handleMarkPaid}
            >
              <Text style={styles.paidButtonText}>I Have Paid</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelOrderButton}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </>
        )}
        
        {hasPaid && !paymentProof && (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={selectPaymentProof}
            disabled={uploadingProof}
          >
            <Text style={styles.uploadButtonText}>
              {uploadingProof ? 'Uploading...' : 'Upload Payment Proof'}
            </Text>
          </TouchableOpacity>
        )}
        
        {trade.status === 'completed' && !trade.adminRating && (
          <TouchableOpacity 
            style={styles.rateButton}
            onPress={() => setShowRating(true)}
          >
            <Text style={styles.rateButtonText}>Rate Admin</Text>
          </TouchableOpacity>
        )}
        
        {(trade.status === 'processing' || trade.status === 'pending') && (
          <TouchableOpacity 
            style={styles.disputeButton}
            onPress={() => setShowDispute(true)}
          >
            <Text style={styles.disputeButtonText}>Raise Dispute</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Modal */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <Text style={styles.modalSubtitle}>How was your experience with the admin?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.star}
                >
                  <Text style={[
                    styles.starText,
                    star <= rating ? styles.starActive : styles.starInactive
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowRating(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitRating}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={showDispute} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raise Dispute</Text>
            <Text style={styles.modalSubtitle}>Please describe the issue:</Text>
            
            <TextInput
              style={styles.disputeInput}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Describe the problem..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDispute(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitDispute}
              >
                <Text style={styles.submitButtonText}>Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Cancel Order Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for cancellation:</Text>
            
            <TextInput
              style={styles.disputeInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleCancelOrder}
              >
                <Text style={styles.submitButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Success Screen */}
      {showSuccess && (
        <DepositSuccessScreen
          crypto={trade.crypto}
          amount={trade.amount}
          fiatAmount={trade.fiatAmount}
          currency={trade.currency}
          orderId={trade.id}
          onClose={() => {
            setShowSuccess(false);
            if (onTradeComplete) {
              onTradeComplete('approved', 'Payment verified and crypto credited');
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1a365d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tradeInfo: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tradeDetails: {
    flex: 1,
  },
  tradeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  tradeRate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  adminInfo: {
    alignItems: 'flex-end',
  },
  adminName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  adminRating: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignItems: 'flex-start',
  },
  systemMessage: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
  },
  adminBubble: {
    backgroundColor: '#e2e8f0',
  },
  systemBubble: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  adminText: {
    color: '#1a365d',
  },
  systemText: {
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  adminTime: {
    color: '#64748b',
  },
  inputContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 12,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelOrderButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelOrderButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  paidButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paidButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rateButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disputeButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disputeButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    padding: 24,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  star: {
    padding: 8,
  },
  starText: {
    fontSize: 32,
  },
  starActive: {
    color: '#f59e0b',
  },
  starInactive: {
    color: '#d1d5db',
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  connectionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  connected: {
    color: '#10b981',
  },
  disconnected: {
    color: '#ef4444',
  },
  disconnectedButton: {
    backgroundColor: '#6b7280',
    opacity: 0.7,
  },
});