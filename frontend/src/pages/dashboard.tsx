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

// API Configuration
const API_BASE = 'https://bpay-app.onrender.com/api';

const api = {
  getRates: async () => {
    try {
      const response = await fetch(`${API_BASE}/trade/rates`);
      return await response.json();
    } catch (error) {
      return { BTC: { buy: 45250000, sell: 44750000 }, ETH: { buy: 2850000, sell: 2820000 }, USDT: { buy: 1580, sell: 1570 } };
    }
  },
  createTrade: async (tradeData: any, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/trade/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(tradeData)
      });
      return await response.json();
    } catch (error) {
      return { error: 'Network error' };
    }
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [rates, setRates] = useState({ BTC: { buy: 0, sell: 0 }, ETH: { buy: 0, sell: 0 }, USDT: { buy: 0, sell: 0 } });
  const [balance, setBalance] = useState({ NGN: 2450000, BTC: 0.04567890, ETH: 0.12345, USDT: 1500 });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isMobile } = useDeviceTheme();
  
  // Fetch real-time rates
  useEffect(() => {
    const fetchRates = async () => {
      const ratesData = await api.getRates();
      setRates(ratesData);
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTradeClick = (type: string) => {
    setTradeType(type);
    setShowTradeModal(true);
  };
  
  const executeTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const tradeData = {
      type: tradeType,
      crypto: selectedCrypto,
      amount: parseFloat(tradeAmount),
      rate: rates[selectedCrypto][tradeType]
    };
    
    const result = await api.createTrade(tradeData, token);
    
    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      const cryptoAmount = parseFloat(tradeAmount);
      const ngnAmount = cryptoAmount * rates[selectedCrypto][tradeType];
      
      if (tradeType === 'buy') {
        setBalance(prev => ({ ...prev, NGN: prev.NGN - ngnAmount, [selectedCrypto]: prev[selectedCrypto] + cryptoAmount }));
      } else {
        setBalance(prev => ({ ...prev, NGN: prev.NGN + ngnAmount, [selectedCrypto]: prev[selectedCrypto] - cryptoAmount }));
      }
      
      setShowTradeModal(false);
      setTradeAmount('');
      notifications.showNotification('Trade Successful!', { body: `${tradeType} ${cryptoAmount} ${selectedCrypto}` });
    }
    
    setLoading(false);
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
            { label: 'Total Balance', value: `₦${balance.NGN.toLocaleString()}`, change: '+2.5%', color: 'orange' },
            { label: 'BTC Holdings', value: balance.BTC.toString(), change: '+5.2%', color: 'yellow' },
            { label: 'ETH Holdings', value: balance.ETH.toString(), change: '+3.1%', color: 'green' },
            { label: 'USDT Holdings', value: balance.USDT.toString(), change: '+0.1%', color: 'blue' }
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
              onClick={() => handleTradeClick('buy')}
              className="bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium mr-2"
            >
              Buy Crypto
            </button>
            <button 
              onClick={() => handleTradeClick('sell')}
              className="bg-orange-100 text-orange-600 px-4 py-2 rounded-md hover:bg-orange-200 transition-colors font-medium"
            >
              Sell Crypto
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

        {/* Trading Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 max-w-90vw">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Cryptocurrency
                </label>
                <select 
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDT">Tether (USDT)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ({selectedCrypto})
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rate: ₦{rates[selectedCrypto]?.[tradeType]?.toLocaleString()}
                </p>
                {tradeAmount && (
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: ₦{(parseFloat(tradeAmount) * (rates[selectedCrypto]?.[tradeType] || 0)).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTrade}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedCrypto}`}
                </button>
              </div>
            </div>
          </div>
        )}

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