import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  crypto: 'BTC' | 'ETH' | 'USDT';
  cryptoAmount: number;
  fiatAmount: number;
  currency: 'NGN' | 'KES';
  rate: number;
  user: {
    name: string;
    email: string;
    country: 'NG' | 'KE';
    kycStatus: 'verified' | 'pending' | 'rejected';
  };
  paymentProof?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  timeRemaining: number;
}

interface Props {
  adminRegion: 'NG' | 'KE' | 'ALL';
  onBack: () => void;
}

export const AdminPendingTradesScreen: React.FC<Props> = ({ adminRegion, onBack }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    // Mock pending trades data
    const mockTrades: Trade[] = [
      {
        id: 'TRD001',
        type: 'buy',
        crypto: 'BTC',
        cryptoAmount: 0.005,
        fiatAmount: 500000,
        currency: 'NGN',
        rate: 100000000,
        user: {
          name: 'John Adebayo',
          email: 'john@email.com',
          country: 'NG',
          kycStatus: 'verified'
        },
        paymentProof: 'https://example.com/proof1.jpg',
        status: 'pending',
        createdAt: new Date(Date.now() - 300000),
        timeRemaining: 600
      },
      {
        id: 'TRD002',
        type: 'sell',
        crypto: 'USDT',
        cryptoAmount: 1000,
        fiatAmount: 128000,
        currency: 'KES',
        rate: 128,
        user: {
          name: 'Mary Wanjiku',
          email: 'mary@email.com',
          country: 'KE',
          kycStatus: 'verified'
        },
        bankDetails: {
          accountName: 'Mary Wanjiku',
          accountNumber: '254712345678',
          bankName: 'M-Pesa'
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 600000),
        timeRemaining: 300
      },
      {
        id: 'TRD003',
        type: 'buy',
        crypto: 'ETH',
        cryptoAmount: 0.2,
        fiatAmount: 800000,
        currency: 'NGN',
        rate: 4000000,
        user: {
          name: 'Ahmed Hassan',
          email: 'ahmed@email.com',
          country: 'NG',
          kycStatus: 'pending'
        },
        paymentProof: 'https://example.com/proof3.jpg',
        status: 'pending',
        createdAt: new Date(Date.now() - 900000),
        timeRemaining: 0
      }
    ];

    // Filter by admin region
    const filteredTrades = adminRegion === 'ALL' 
      ? mockTrades 
      : mockTrades.filter(trade => trade.user.country === adminRegion);

    setTrades(filteredTrades);
  }, [adminRegion]);

  const handleApproveTrade = async (tradeId: string) => {
    Alert.alert(
      'Approve Trade',
      'Are you sure you want to approve this trade?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setTrades(prev => prev.map(trade => 
              trade.id === tradeId 
                ? { ...trade, status: 'approved' as const }
                : trade
            ));
            Alert.alert('Success', 'Trade approved successfully');
          }
        }
      ]
    );
  };

  const handleRejectTrade = async (tradeId: string) => {
    Alert.alert(
      'Reject Trade',
      'Are you sure you want to reject this trade?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setTrades(prev => prev.map(trade => 
              trade.id === tradeId 
                ? { ...trade, status: 'rejected' as const }
                : trade
            ));
            Alert.alert('Trade Rejected', 'Trade has been rejected');
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'EXPIRED';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return trade.status === 'pending';
    return trade.status === 'pending' && trade.type === filter;
  });

  if (selectedTrade) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedTrade(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Trade Details</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.tradeCard}>
            <View style={styles.tradeHeader}>
              <Text style={styles.tradeId}>#{selectedTrade.id}</Text>
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={styles.statusText}>PENDING</Text>
              </View>
            </View>

            <View style={styles.tradeDetails}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={[styles.detailValue, selectedTrade.type === 'buy' ? styles.buyText : styles.sellText]}>
                {selectedTrade.type.toUpperCase()} {selectedTrade.crypto}
              </Text>

              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                {selectedTrade.cryptoAmount} {selectedTrade.crypto} = {selectedTrade.currency} {selectedTrade.fiatAmount.toLocaleString()}
              </Text>

              <Text style={styles.detailLabel}>Rate:</Text>
              <Text style={styles.detailValue}>
                {selectedTrade.currency} {selectedTrade.rate.toLocaleString()} per {selectedTrade.crypto}
              </Text>

              <Text style={styles.detailLabel}>User:</Text>
              <Text style={styles.detailValue}>{selectedTrade.user.name}</Text>
              <Text style={styles.detailSubValue}>{selectedTrade.user.email}</Text>

              <Text style={styles.detailLabel}>KYC Status:</Text>
              <View style={[styles.kycBadge, selectedTrade.user.kycStatus === 'verified' ? styles.verifiedBadge : styles.pendingBadge]}>
                <Text style={styles.kycText}>{selectedTrade.user.kycStatus.toUpperCase()}</Text>
              </View>

              <Text style={styles.detailLabel}>Time Remaining:</Text>
              <Text style={[styles.detailValue, selectedTrade.timeRemaining <= 0 && styles.expiredText]}>
                {formatTime(selectedTrade.timeRemaining)}
              </Text>
            </View>

            {selectedTrade.paymentProof && (
              <View style={styles.proofSection}>
                <Text style={styles.detailLabel}>Payment Proof:</Text>
                <Image source={{ uri: selectedTrade.paymentProof }} style={styles.proofImage} />
              </View>
            )}

            {selectedTrade.bankDetails && (
              <View style={styles.bankSection}>
                <Text style={styles.detailLabel}>Bank Details:</Text>
                <Text style={styles.detailValue}>{selectedTrade.bankDetails.accountName}</Text>
                <Text style={styles.detailSubValue}>{selectedTrade.bankDetails.accountNumber}</Text>
                <Text style={styles.detailSubValue}>{selectedTrade.bankDetails.bankName}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.approveButton}
              onPress={() => handleApproveTrade(selectedTrade.id)}
            >
              <Text style={styles.approveButtonText}>✓ Approve Trade</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleRejectTrade(selectedTrade.id)}
            >
              <Text style={styles.rejectButtonText}>✗ Reject Trade</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending Trades</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'buy', 'sell'] as const).map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterButton, filter === filterType && styles.activeFilter]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[styles.filterText, filter === filterType && styles.activeFilterText]}>
              {filterType === 'all' ? 'All Trades' : `${filterType.toUpperCase()} Orders`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {filteredTrades.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending trades</Text>
          </View>
        ) : (
          filteredTrades.map(trade => (
            <TouchableOpacity
              key={trade.id}
              style={[styles.tradeItem, trade.timeRemaining <= 0 && styles.expiredTrade]}
              onPress={() => setSelectedTrade(trade)}
            >
              <View style={styles.tradeInfo}>
                <View style={styles.tradeTop}>
                  <Text style={styles.tradeIdSmall}>#{trade.id}</Text>
                  <Text style={[styles.tradeType, trade.type === 'buy' ? styles.buyText : styles.sellText]}>
                    {trade.type.toUpperCase()}
                  </Text>
                </View>
                
                <Text style={styles.tradeAmount}>
                  {trade.cryptoAmount} {trade.crypto} = {trade.currency} {trade.fiatAmount.toLocaleString()}
                </Text>
                
                <Text style={styles.tradeUser}>{trade.user.name} • {trade.user.country}</Text>
                
                <Text style={[styles.tradeTime, trade.timeRemaining <= 0 && styles.expiredText]}>
                  {formatTime(trade.timeRemaining)}
                </Text>
              </View>
              
              <View style={styles.tradeActions}>
                <View style={[styles.kycIndicator, trade.user.kycStatus === 'verified' ? styles.verifiedIndicator : styles.pendingIndicator]} />
                <Text style={styles.viewText}>View →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#f59e0b',
  },
  filterText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  tradeItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expiredTrade: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  tradeInfo: {
    flex: 1,
  },
  tradeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tradeIdSmall: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  tradeType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  buyText: {
    color: '#10b981',
  },
  sellText: {
    color: '#ef4444',
  },
  tradeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  tradeUser: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  tradeTime: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  expiredText: {
    color: '#ef4444',
  },
  tradeActions: {
    alignItems: 'center',
  },
  kycIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  verifiedIndicator: {
    backgroundColor: '#10b981',
  },
  pendingIndicator: {
    backgroundColor: '#f59e0b',
  },
  viewText: {
    color: '#64748b',
    fontSize: 12,
  },
  tradeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tradeId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  tradeDetails: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#64748b',
  },
  kycBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  kycText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  proofSection: {
    marginBottom: 20,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  bankSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});