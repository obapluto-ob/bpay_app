import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

interface RateAlert {
  id: string;
  crypto: 'BTC' | 'ETH' | 'USDT';
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

interface Props {
  onBack: () => void;
  adminName: string;
}

export const AdminRateManagementScreen: React.FC<Props> = ({ onBack, adminName }) => {
  const [currentRates, setCurrentRates] = useState({
    BTC: 98500,
    ETH: 3850,
    USDT: 1.00
  });

  const [exchangeRates, setExchangeRates] = useState({
    USDNGN: 1650,
    USDKES: 128
  });

  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [newAlert, setNewAlert] = useState({
    crypto: 'BTC' as 'BTC' | 'ETH' | 'USDT',
    condition: 'above' as 'above' | 'below',
    targetPrice: ''
  });

  const [manualRates, setManualRates] = useState({
    BTC: '',
    ETH: '',
    USDT: ''
  });

  useEffect(() => {
    // Mock existing alerts
    const mockAlerts: RateAlert[] = [
      {
        id: 'ALT001',
        crypto: 'BTC',
        condition: 'above',
        targetPrice: 100000,
        currentPrice: 98500,
        isActive: true,
        createdBy: 'Rate Manager',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'ALT002',
        crypto: 'USDT',
        condition: 'above',
        targetPrice: 128,
        currentPrice: 128.5,
        isActive: false,
        createdBy: adminName,
        createdAt: new Date(Date.now() - 7200000)
      }
    ];
    setAlerts(mockAlerts);
  }, [adminName]);

  const createAlert = () => {
    if (!newAlert.targetPrice) {
      Alert.alert('Error', 'Please enter target price');
      return;
    }

    const alert: RateAlert = {
      id: `ALT${Date.now()}`,
      crypto: newAlert.crypto,
      condition: newAlert.condition,
      targetPrice: parseFloat(newAlert.targetPrice),
      currentPrice: currentRates[newAlert.crypto],
      isActive: true,
      createdBy: adminName,
      createdAt: new Date()
    };

    setAlerts(prev => [alert, ...prev]);
    setNewAlert({ crypto: 'BTC', condition: 'above', targetPrice: '' });
    Alert.alert('Success', 'Price alert created successfully');
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        }
      ]
    );
  };

  const updateManualRate = (crypto: 'BTC' | 'ETH' | 'USDT') => {
    const newRate = parseFloat(manualRates[crypto]);
    if (!newRate || newRate <= 0) {
      Alert.alert('Error', 'Please enter valid rate');
      return;
    }

    Alert.alert(
      'Update Rate',
      `Set ${crypto} rate to $${newRate.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            setCurrentRates(prev => ({ ...prev, [crypto]: newRate }));
            setManualRates(prev => ({ ...prev, [crypto]: '' }));
            Alert.alert('Success', `${crypto} rate updated to $${newRate.toLocaleString()}`);
          }
        }
      ]
    );
  };

  const getAlertStatus = (alert: RateAlert) => {
    const { condition, targetPrice, currentPrice } = alert;
    const triggered = condition === 'above' 
      ? currentPrice >= targetPrice 
      : currentPrice <= targetPrice;
    
    return triggered;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate Management</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current USD Rates</Text>
          <View style={styles.ratesGrid}>
            {Object.entries(currentRates).map(([crypto, rate]) => (
              <View key={crypto} style={styles.rateCard}>
                <Text style={styles.cryptoSymbol}>{crypto}</Text>
                <Text style={styles.rateValue}>${rate.toLocaleString()}</Text>
                <Text style={styles.rateLabel}>per {crypto}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exchange Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiat Exchange Rates</Text>
          <View style={styles.exchangeRates}>
            <View style={styles.exchangeCard}>
              <Text style={styles.exchangeLabel}>🇳🇬 USD → NGN</Text>
              <Text style={styles.exchangeValue}>₦{exchangeRates.USDNGN}</Text>
            </View>
            <View style={styles.exchangeCard}>
              <Text style={styles.exchangeLabel}>🇰🇪 USD → KES</Text>
              <Text style={styles.exchangeValue}>KSh{exchangeRates.USDKES}</Text>
            </View>
          </View>
        </View>

        {/* Manual Rate Override */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Rate Override</Text>
          <Text style={styles.sectionSubtitle}>Override live rates for specific situations</Text>
          
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <View key={crypto} style={styles.manualRateRow}>
              <Text style={styles.manualRateLabel}>{crypto}:</Text>
              <TextInput
                style={styles.manualRateInput}
                placeholder={`Current: $${currentRates[crypto].toLocaleString()}`}
                value={manualRates[crypto]}
                onChangeText={(text) => setManualRates(prev => ({ ...prev, [crypto]: text }))}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => updateManualRate(crypto)}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Create New Alert */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Price Alert</Text>
          
          <View style={styles.alertForm}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Crypto:</Text>
              <View style={styles.cryptoSelector}>
                {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
                  <TouchableOpacity
                    key={crypto}
                    style={[styles.cryptoButton, newAlert.crypto === crypto && styles.selectedCrypto]}
                    onPress={() => setNewAlert(prev => ({ ...prev, crypto }))}
                  >
                    <Text style={[styles.cryptoButtonText, newAlert.crypto === crypto && styles.selectedText]}>
                      {crypto}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Condition:</Text>
              <View style={styles.conditionSelector}>
                {(['above', 'below'] as const).map(condition => (
                  <TouchableOpacity
                    key={condition}
                    style={[styles.conditionButton, newAlert.condition === condition && styles.selectedCondition]}
                    onPress={() => setNewAlert(prev => ({ ...prev, condition }))}
                  >
                    <Text style={[styles.conditionButtonText, newAlert.condition === condition && styles.selectedText]}>
                      {condition.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Target Price:</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Enter USD price"
                value={newAlert.targetPrice}
                onChangeText={(text) => setNewAlert(prev => ({ ...prev, targetPrice: text }))}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.createAlertButton} onPress={createAlert}>
              <Text style={styles.createAlertButtonText}>🚨 Create Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Alerts ({alerts.length})</Text>
          
          {alerts.length === 0 ? (
            <Text style={styles.noAlerts}>No price alerts created</Text>
          ) : (
            alerts.map(alert => {
              const isTriggered = getAlertStatus(alert);
              return (
                <View key={alert.id} style={[styles.alertCard, isTriggered && styles.triggeredAlert]}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertCrypto}>{alert.crypto}</Text>
                    <View style={styles.alertActions}>
                      <TouchableOpacity
                        style={[styles.toggleButton, alert.isActive ? styles.activeToggle : styles.inactiveToggle]}
                        onPress={() => toggleAlert(alert.id)}
                      >
                        <Text style={styles.toggleText}>
                          {alert.isActive ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteAlert(alert.id)}
                      >
                        <Text style={styles.deleteText}>✗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.alertCondition}>
                    Alert when {alert.condition} ${alert.targetPrice.toLocaleString()}
                  </Text>
                  
                  <Text style={styles.alertCurrent}>
                    Current: ${alert.currentPrice.toLocaleString()}
                  </Text>
                  
                  {isTriggered && (
                    <Text style={styles.triggeredText}>🚨 ALERT TRIGGERED!</Text>
                  )}
                  
                  <Text style={styles.alertMeta}>
                    Created by {alert.createdBy} • {alert.createdAt.toLocaleDateString()}
                  </Text>
                </View>
              );
            })
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  ratesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rateCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  rateLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  exchangeRates: {
    flexDirection: 'row',
    gap: 12,
  },
  exchangeCard: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exchangeLabel: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
  },
  exchangeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  manualRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  manualRateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    width: 50,
  },
  manualRateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  alertForm: {
    gap: 16,
  },
  formRow: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  cryptoSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  cryptoButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedCrypto: {
    backgroundColor: '#f59e0b',
  },
  cryptoButtonText: {
    fontWeight: 'bold',
    color: '#1a365d',
  },
  selectedText: {
    color: 'white',
  },
  conditionSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedCondition: {
    backgroundColor: '#10b981',
  },
  conditionButtonText: {
    fontWeight: 'bold',
    color: '#1a365d',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  createAlertButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createAlertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noAlerts: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    padding: 20,
  },
  alertCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  triggeredAlert: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertCrypto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeToggle: {
    backgroundColor: '#10b981',
  },
  inactiveToggle: {
    backgroundColor: '#64748b',
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertCondition: {
    fontSize: 16,
    color: '#1a365d',
    marginBottom: 4,
  },
  alertCurrent: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  triggeredText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
});