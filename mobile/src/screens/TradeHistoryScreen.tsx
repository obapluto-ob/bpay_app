import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { apiService } from '../services/api';
import { Trade } from '../types';
import { TradeChatScreen } from './TradeChatScreen';

interface Props {
  token: string;
  userCountry: 'NG' | 'KE';
  onClose: () => void;
}

export const TradeHistoryScreen: React.FC<Props> = ({ token, userCountry, onClose }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [paymentProof, setPaymentProof] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [chatTrade, setChatTrade] = useState<any>(null);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://bpay-app.onrender.com/api/trade/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || data || []);
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedTrade || !paymentProof) {
      Alert.alert('Error', 'Please enter payment proof');
      return;
    }

    try {
      await apiService.uploadPaymentProof(selectedTrade.id, paymentProof, token);
      Alert.alert('Success', 'Payment proof uploaded successfully');
      setShowProofModal(false);
      setPaymentProof('');
      loadTrades();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload payment proof');
    }
  };

  const getStatusColor = (status: Trade['status']) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending_payment': return '#f59e0b';
      case 'payment_uploaded': return '#3b82f6';
      case 'verifying': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: Trade['status']) => {
    switch (status) {
      case 'pending_payment': return 'Awaiting Payment';
      case 'payment_uploaded': return 'Payment Uploaded';
      case 'verifying': return 'Verifying';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Trade History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onClose} 
        style={styles.closeButtonContainer}
        activeOpacity={0.5}
      >
        <Text style={styles.closeButton}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.title}>Trade History</Text>
      </View>

      <ScrollView style={styles.tradesList}>
        {trades.length === 0 ? (
          <Text style={styles.noTrades}>No trades yet</Text>
        ) : (
          trades.map((trade) => (
            <View key={trade.id} style={styles.tradeItem}>
              <View style={styles.tradeHeader}>
                <Text style={styles.tradeType}>
                  {trade.type === 'sell' ? 'SELL' : 'BUY'} {trade.crypto}
                </Text>
                <Text style={[styles.status, { color: getStatusColor(trade.status) }]}>
                  {getStatusText(trade.status)}
                </Text>
              </View>

              <Text style={styles.tradeAmount}>
                {trade.type === 'sell' 
                  ? `${trade.amount} ${trade.crypto}`
                  : `${userCountry === 'NG' ? '₦' : 'KSh'}${trade.fiatAmount.toLocaleString()}`
                }
              </Text>

              <Text style={styles.tradeValue}>
                {trade.type === 'sell'
                  ? `≈ ${userCountry === 'NG' ? '₦' : 'KSh'}${trade.fiatAmount.toLocaleString()}`
                  : `≈ ${(trade.fiatAmount / trade.rate).toFixed(8)} ${trade.crypto}`
                }
              </Text>

              <Text style={styles.tradeDate}>
                {new Date(trade.created_at).toLocaleDateString()}
              </Text>

              <View style={styles.tradeActions}>
                {trade.status === 'pending_payment' && trade.type === 'buy_request' && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => {
                      setSelectedTrade(trade);
                      setShowProofModal(true);
                    }}
                  >
                    <Text style={styles.uploadButtonText}>Upload Payment Proof</Text>
                  </TouchableOpacity>
                )}
                
                {(trade.status === 'processing' || trade.status === 'payment_uploaded' || trade.status === 'verifying') && (
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={async () => {
                      try {
                        // Get full trade details from API
                        const fullTrade = await apiService.getTrade(trade.id, token);
                        
                        setChatTrade({
                          ...trade,
                          ...fullTrade,
                          chatMessages: fullTrade?.chatMessages || [],
                          assignedAdmin: fullTrade?.assignedAdmin || 'system_admin',
                          adminName: fullTrade?.adminName || 'System Admin',
                          adminEmail: fullTrade?.adminEmail || 'admin@bpay.com',
                          adminRating: fullTrade?.adminRating || 4.5
                        });
                        setShowChatScreen(true);
                      } catch (error) {
                        // Fallback to basic trade data
                        setChatTrade({
                          ...trade,
                          chatMessages: [],
                          assignedAdmin: 'system_admin',
                          adminName: 'System Admin',
                          adminEmail: 'admin@bpay.com',
                          adminRating: 4.5
                        });
                        setShowChatScreen(true);
                      }
                    }}
                  >
                    <Text style={styles.chatButtonText}>Chat with Admin</Text>
                  </TouchableOpacity>
                )}
                
                {trade.status === 'completed' && !trade.adminRating && (
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={async () => {
                      try {
                        // Get full trade details from API
                        const fullTrade = await apiService.getTrade(trade.id, token);
                        
                        setChatTrade({
                          ...trade,
                          ...fullTrade,
                          chatMessages: fullTrade?.chatMessages || [],
                          assignedAdmin: fullTrade?.assignedAdmin || 'system_admin',
                          adminName: fullTrade?.adminName || 'System Admin',
                          adminEmail: fullTrade?.adminEmail || 'admin@bpay.com',
                          adminRating: fullTrade?.adminRating || 4.5
                        });
                        setShowChatScreen(true);
                      } catch (error) {
                        // Fallback to basic trade data
                        setChatTrade({
                          ...trade,
                          chatMessages: [],
                          assignedAdmin: 'system_admin',
                          adminName: 'System Admin',
                          adminEmail: 'admin@bpay.com',
                          adminRating: 4.5
                        });
                        setShowChatScreen(true);
                      }
                    }}
                  >
                    <Text style={styles.rateButtonText}>Rate Experience</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showProofModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Payment Proof</Text>
            
            <TextInput
              style={styles.proofInput}
              placeholder="Transaction reference or description"
              value={paymentProof}
              onChangeText={setPaymentProof}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowProofModal(false);
                  setPaymentProof('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleUploadProof}
              >
                <Text style={styles.confirmButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showChatScreen && chatTrade && (
        <Modal visible={showChatScreen} animationType="slide">
          <TradeChatScreen
            trade={chatTrade}
            userToken={token}
            onClose={() => {
              setShowChatScreen(false);
              setChatTrade(null);
            }}
            onRateAdmin={(rating) => {
              // Update trade with rating
              const updatedTrades = trades.map(t => 
                t.id === chatTrade.id ? { ...t, adminRating: rating } : t
              );
              setTrades(updatedTrades);
            }}
            onRaiseDispute={(reason) => {
              // Update trade status to disputed
              const updatedTrades = trades.map(t => 
                t.id === chatTrade.id ? { ...t, status: 'disputed', disputeReason: reason } : t
              );
              setTrades(updatedTrades);
            }}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  header: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  tradesList: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    borderRadius: 12,
    marginBottom: 15,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tradeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  tradeValue: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  tradeDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tradeActions: {
    marginTop: 10,
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rateButton: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
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
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a365d',
  },
  proofInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
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
});