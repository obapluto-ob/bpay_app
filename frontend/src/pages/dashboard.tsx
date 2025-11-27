import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import BPayLogo from '../components/BPayLogo';
import ThemeToggle from '../components/ThemeToggle';
import CryptoRates from '../components/CryptoRates';
import TradingChart from '../components/TradingChart';
import HeroSection from '../components/HeroSection';
import FeatureCards from '../components/FeatureCards';
import { useDeviceTheme } from '../components/DeviceTheme';
import { notifications } from '../utils/notifications';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const router = useRouter();
  const { isMobile } = useDeviceTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      
      // Request notification permission
      notifications.requestPermission();
      
      // Welcome notification
      setTimeout(() => {
        notifications.showNotification('Welcome to BPay!', {
          body: 'Your crypto trading dashboard is ready',
          icon: '/5782897843587714011_120.jpg'
        });
      }, 2000);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/auth');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  const handleTradeClick = () => {
    notifications.notifyPriceAlert('BTC', '₦50,000,000', '+2.5');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading BPay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <BPayLogo size="sm" />
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Feature Cards */}
        <FeatureCards />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Balance', value: '₦0.00', change: '+0%', color: 'orange' },
            { label: 'BTC Holdings', value: '0.00000000', change: '+0%', color: 'yellow' },
            { label: 'Active Trades', value: '0', change: '0', color: 'green' },
            { label: 'Profit/Loss', value: '₦0.00', change: '+0%', color: 'blue' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className={`text-sm text-${stat.color}-500`}>{stat.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Chart */}
          <div className="lg:col-span-2">
            <TradingChart symbol={selectedCrypto} currency={selectedCurrency} />
          </div>

          {/* Live Rates */}
          <div>
            <CryptoRates />
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-medium mb-2">Quick Trade</h3>
            <p className="mb-4 opacity-90">Buy or sell crypto instantly</p>
            <button 
              onClick={handleTradeClick}
              className="bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Start Trading
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-medium mb-2">Wallet</h3>
            <p className="mb-4 opacity-90">Manage your crypto & fiat</p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium">
              View Wallet
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <h3 className="text-lg font-medium mb-2">History</h3>
            <p className="mb-4 opacity-90">Track all transactions</p>
            <button className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium">
              View History
            </button>
          </div>
        </motion.div>

        {/* Currency Selector */}
        <div className="mt-8 flex justify-center space-x-4">
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="NGN">Nigerian Naira (₦)</option>
            <option value="KES">Kenyan Shillings (KSh)</option>
          </select>
          
          <select 
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT)</option>
          </select>
        </div>
      </main>
    </div>
  );
}