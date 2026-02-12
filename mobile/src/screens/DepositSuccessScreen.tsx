import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface Props {
  crypto: string;
  amount: number;
  fiatAmount: number;
  currency: string;
  orderId: string;
  onClose: () => void;
}

export const DepositSuccessScreen: React.FC<Props> = ({
  crypto,
  amount,
  fiatAmount,
  currency,
  orderId,
  onClose
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkCircle}>
            <View style={styles.checkMark} />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Verified</Text>
        <Text style={styles.subtitle}>Your crypto has been credited successfully</Text>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Crypto Received</Text>
            <Text style={styles.detailValueHighlight}>
              {amount.toFixed(8)} {crypto}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>
              {currency} {fiatAmount.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>View Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Make Another Trade</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkMark: {
    width: 30,
    height: 15,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
  },
  detailValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#1a365d',
    fontSize: 16,
    fontWeight: '600',
  },
});
