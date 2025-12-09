import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function ReferralScreen() {
  const [referralCode, setReferralCode] = useState('');
  const [earnings, setEarnings] = useState(0);
  const [referrals, setReferrals] = useState([]);
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE}/referrals/user/${userId}`);
      const data = await response.json();
      
      setReferralCode(data.referralCode);
      setEarnings(data.earnings);
      setReferrals(data.referrals || []);
      setTotalReferrals(data.totalReferrals);
    } catch (error) {
      console.error('Fetch referral info error:', error);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const shareReferral = async () => {
    try {
      await Share.share({
        message: `Join BPay and get ₦500 bonus! Use my referral code: ${referralCode}\n\nDownload: https://bpay.app`
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Refer & Earn</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₦{earnings.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalReferrals}</Text>
          <Text style={styles.statLabel}>Referrals</Text>
        </View>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{referralCode}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
            <Text style={styles.copyButtonText}>📋 Copy Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferral}>
            <Text style={styles.shareButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1️⃣</Text>
          <Text style={styles.stepText}>Share your referral code with friends</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2️⃣</Text>
          <Text style={styles.stepText}>They sign up using your code</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3️⃣</Text>
          <Text style={styles.stepText}>You earn ₦500 when they complete their first trade</Text>
        </View>
      </View>

      <View style={styles.referralsList}>
        <Text style={styles.sectionTitle}>Your Referrals ({totalReferrals})</Text>
        <FlatList
          data={referrals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.referralItem}>
              <View style={styles.referralInfo}>
                <Text style={styles.referralName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.referralDate}>Joined {new Date(item.joined_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, item.reward_paid && styles.statusBadgePaid]}>
                <Text style={styles.statusText}>{item.reward_paid ? '✅ Paid' : '⏳ Pending'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Start sharing your code to earn rewards!</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#f59e0b' },
  statLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 20 },
  codeCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  codeLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 12 },
  codeBox: { backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#fbbf24', borderStyle: 'dashed' },
  codeText: { fontSize: 24, fontWeight: 'bold', color: '#f59e0b', textAlign: 'center', letterSpacing: 2 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  copyButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, alignItems: 'center' },
  copyButtonText: { fontWeight: 'bold', color: '#475569' },
  shareButton: { flex: 1, backgroundColor: '#f59e0b', padding: 14, borderRadius: 12, alignItems: 'center' },
  shareButtonText: { fontWeight: 'bold', color: '#fff' },
  howItWorks: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNumber: { fontSize: 24, marginRight: 12 },
  stepText: { flex: 1, fontSize: 14, color: '#64748b' },
  referralsList: { flex: 1, backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 20 },
  referralItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  referralDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgePaid: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4 }
});
