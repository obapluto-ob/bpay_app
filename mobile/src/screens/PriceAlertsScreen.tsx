import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function PriceAlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [crypto, setCrypto] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [currency, setCurrency] = useState('NGN');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE}/price-alerts/user/${userId}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Fetch alerts error:', error);
    }
  };

  const createAlert = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE}/price-alerts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, crypto, targetPrice: parseFloat(targetPrice), condition, currency })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Price alert created!');
        setShowModal(false);
        setTargetPrice('');
        fetchAlerts();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create alert');
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await fetch(`${API_BASE}/price-alerts/${alertId}`, { method: 'DELETE' });
      fetchAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete alert');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Price Alerts</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ New Alert</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View style={styles.alertInfo}>
              <Text style={styles.cryptoText}>{item.crypto}</Text>
              <Text style={styles.conditionText}>
                {item.condition === 'above' ? '📈' : '📉'} {item.condition} {currency === 'NGN' ? '₦' : 'KSh'}{item.target_price.toLocaleString()}
              </Text>
              <Text style={styles.statusText}>{item.is_active ? '✅ Active' : '⏸️ Paused'}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteAlert(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No price alerts yet</Text>
            <Text style={styles.emptySubtext}>Create an alert to get notified when crypto reaches your target price</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Price Alert</Text>

            <Text style={styles.label}>Cryptocurrency</Text>
            <View style={styles.cryptoButtons}>
              {['BTC', 'ETH', 'USDT'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cryptoButton, crypto === c && styles.cryptoButtonActive]}
                  onPress={() => setCrypto(c)}
                >
                  <Text style={[styles.cryptoButtonText, crypto === c && styles.cryptoButtonTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Condition</Text>
            <View style={styles.cryptoButtons}>
              <TouchableOpacity
                style={[styles.cryptoButton, condition === 'above' && styles.cryptoButtonActive]}
                onPress={() => setCondition('above')}
              >
                <Text style={[styles.cryptoButtonText, condition === 'above' && styles.cryptoButtonTextActive]}>📈 Above</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cryptoButton, condition === 'below' && styles.cryptoButtonActive]}
                onPress={() => setCondition('below')}
              >
                <Text style={[styles.cryptoButtonText, condition === 'below' && styles.cryptoButtonTextActive]}>📉 Below</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Target Price ({currency})</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter target price"
              keyboardType="numeric"
              value={targetPrice}
              onChangeText={setTargetPrice}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={createAlert}>
                <Text style={styles.createButtonText}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  addButton: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  alertCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 10, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  alertInfo: { flex: 1 },
  cryptoText: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  conditionText: { fontSize: 16, color: '#64748b', marginTop: 4 },
  statusText: { fontSize: 14, color: '#10b981', marginTop: 4 },
  deleteButton: { justifyContent: 'center', paddingLeft: 16 },
  deleteText: { fontSize: 24 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 16, marginBottom: 8 },
  cryptoButtons: { flexDirection: 'row', gap: 8 },
  cryptoButton: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center' },
  cryptoButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  cryptoButtonText: { fontWeight: 'bold', color: '#64748b' },
  cryptoButtonTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelButtonText: { fontWeight: 'bold', color: '#64748b' },
  createButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f59e0b', alignItems: 'center' },
  createButtonText: { fontWeight: 'bold', color: '#fff' }
});
