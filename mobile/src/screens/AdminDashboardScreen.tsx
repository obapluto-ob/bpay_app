import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin';
  permissions: string[];
  assignedRegion?: 'NG' | 'KE' | 'ALL';
}

interface Props {
  admin: AdminUser;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export const AdminDashboardScreen: React.FC<Props> = ({ admin, onLogout, onNavigate }) => {
  const [stats, setStats] = useState({
    pendingTrades: 12,
    todayVolume: 2450000,
    activeUsers: 1847,
    pendingKYC: 23,
    alertsTriggered: 5
  });

  const hasPermission = (permission: string) => {
    return admin.permissions.includes('all') || admin.permissions.includes(permission);
  };

  const getRegionText = () => {
    if (admin.assignedRegion === 'NG') return '🇳🇬 Nigeria';
    if (admin.assignedRegion === 'KE') return '🇰🇪 Kenya';
    return '🌍 Global';
  };

  const adminMenuItems = [
    {
      title: 'Pending Trades',
      subtitle: `${stats.pendingTrades} trades awaiting approval`,
      icon: '⏳',
      screen: 'PendingTrades',
      permission: 'approve_trades',
      urgent: stats.pendingTrades > 10
    },
    {
      title: 'Rate Management',
      subtitle: 'Set rates and price alerts',
      icon: '📈',
      screen: 'RateManagement', 
      permission: 'manage_rates',
      urgent: stats.alertsTriggered > 0
    },
    {
      title: 'User Management',
      subtitle: `${stats.activeUsers} active users`,
      icon: '👥',
      screen: 'UserManagement',
      permission: 'view_users',
      urgent: false
    },
    {
      title: 'KYC Verification',
      subtitle: `${stats.pendingKYC} pending verifications`,
      icon: '🆔',
      screen: 'KYCManagement',
      permission: 'manage_kyc',
      urgent: stats.pendingKYC > 20
    },
    {
      title: 'Transaction History',
      subtitle: 'View all platform transactions',
      icon: '📋',
      screen: 'TransactionHistory',
      permission: 'view_transactions',
      urgent: false
    },
    {
      title: 'Analytics',
      subtitle: 'Platform performance metrics',
      icon: '📊',
      screen: 'Analytics',
      permission: 'view_analytics',
      urgent: false
    },
    {
      title: 'System Settings',
      subtitle: 'Platform configuration',
      icon: '⚙️',
      screen: 'SystemSettings',
      permission: 'all',
      urgent: false
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.adminInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{admin.name}</Text>
          <Text style={styles.adminRole}>{admin.role.replace('_', ' ').toUpperCase()} • {getRegionText()}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingTrades}</Text>
              <Text style={styles.statLabel}>Pending Trades</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₦{(stats.todayVolume / 1000000).toFixed(1)}M</Text>
              <Text style={styles.statLabel}>Today's Volume</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeUsers}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.alertsTriggered}</Text>
              <Text style={styles.statLabel}>Rate Alerts</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Admin Functions</Text>
          {adminMenuItems.map((item, index) => {
            if (!hasPermission(item.permission)) return null;
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, item.urgent && styles.urgentItem]}
                onPress={() => onNavigate(item.screen)}
              >
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>{item.icon}</Text>
                  {item.urgent && <View style={styles.urgentDot} />}
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {admin.role === 'rate_admin' && (
          <View style={styles.rateAdminSection}>
            <Text style={styles.sectionTitle}>Rate Control Center</Text>
            <View style={styles.rateControls}>
              <TouchableOpacity style={styles.rateButton} onPress={() => onNavigate('LiveRates')}>
                <Text style={styles.rateButtonText}>📊 Live Rates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rateButton} onPress={() => onNavigate('SetAlerts')}>
                <Text style={styles.rateButtonText}>🚨 Set Alerts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rateButton} onPress={() => onNavigate('RateHistory')}>
                <Text style={styles.rateButtonText}>📈 Rate History</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  adminName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  adminRole: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuItem: {
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
  urgentItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  menuIconText: {
    fontSize: 20,
  },
  urgentDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  menuArrow: {
    fontSize: 18,
    color: '#94a3b8',
  },
  rateAdminSection: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  rateControls: {
    flexDirection: 'row',
    gap: 8,
  },
  rateButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});