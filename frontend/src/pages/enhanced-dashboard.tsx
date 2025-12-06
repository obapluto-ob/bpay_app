import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function EnhancedDashboard() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
  const [rates, setRates] = useState({ BTC: { NGN: 0, KES: 0 }, ETH: { NGN: 0, KES: 0 }, USDT: { NGN: 0, KES: 0 } });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeCurrency, setTradeCurrency] = useState('NGN');
  const [showQuickTrade, setShowQuickTrade] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const profileRes = await fetch(`${API_BASE}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData);
        }

        const balanceRes = await fetch(`${API_BASE}/user/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        }

        const ratesRes = await fetch(`${API_BASE}/trade/rates`);
        if (ratesRes.ok) {
          const ratesData = await ratesRes.json();
          setRates(ratesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  const handleQuickTrade = async () => {
    if (!tradeAmount || !selectedCrypto) {
      alert('Please fill all fields');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/trade/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: tradeType,
          crypto: selectedCrypto,
          amount: parseFloat(tradeAmount),
          currency: tradeCurrency
        })
      });

      if (response.ok) {
        alert(`${tradeType} order created successfully!`);
        setShowQuickTrade(false);
        setTradeAmount('');
      } else {
        const error = await response.json();
        alert(error.message || 'Trade failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white text-lg">Loading BPay Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-orange-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-200'} shadow-lg border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="/5782897843587714011_120.jpg" 
                  alt="BPay" 
                  className="w-12 h-12 rounded-full shadow-lg ring-2 ring-orange-500"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>BPay Pro</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trading Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all hover:scale-105`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} hidden md:block`}>
                {user?.fullName || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className={`${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-xl text-sm transition-all hover:scale-105 shadow-lg`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* User Status Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm border-gray-200'} rounded-2xl shadow-xl p-6 mb-6 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full ${darkMode ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} flex items-center justify-center text-white text-xl font-bold`}>
                {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome Back!</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Country: {user?.kycStatus === 'approved' ? (user?.country === 'NG' ? '🇳🇬 Nigeria' : '🇰🇪 Kenya') : 'Will be set during KYC'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                user?.kycStatus === 'approved' ? 'text-green-700 bg-green-100' :
                user?.kycStatus === 'processing' ? 'text-yellow-700 bg-yellow-100' :
                user?.kycStatus === 'rejected' ? 'text-red-700 bg-red-100' :
                'text-gray-700 bg-gray-100'
              }`}>
                KYC: {user?.kycStatus === 'approved' ? '✅ Verified' : 
                      user?.kycStatus === 'processing' ? '⏳ Processing' :
                      user?.kycStatus === 'rejected' ? '❌ Rejected' : '📋 Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { name: 'NGN', value: balance.NGN, symbol: '₦', color: 'from-green-500 to-emerald-600' },
            { name: 'KES', value: balance.KES, symbol: 'KSh', color: 'from-blue-500 to-cyan-600' },
            { name: 'BTC', value: balance.BTC, symbol: '₿', color: 'from-orange-500 to-yellow-600', decimals: 8 },
            { name: 'ETH', value: balance.ETH, symbol: 'Ξ', color: 'from-purple-500 to-indigo-600', decimals: 6 },
            { name: 'USDT', value: balance.USDT, symbol: '$', color: 'from-teal-500 to-green-600', decimals: 2 }
          ].map((coin) => (
            <div key={coin.name} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm border-gray-200'} rounded-2xl shadow-lg p-4 border hover:scale-105 transition-all cursor-pointer`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${coin.color} flex items-center justify-center text-white font-bold mb-3`}>
                {coin.symbol}
              </div>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{coin.name} Balance</h3>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {coin.symbol}{coin.decimals ? coin.value.toFixed(coin.decimals) : coin.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Trade Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Live Rates */}
          <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm border-gray-200'} rounded-2xl shadow-xl p-6 border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Crypto Rates</h3>
              <div className="flex space-x-2">
                {['BTC', 'ETH', 'USDT'].map((crypto) => (
                  <button
                    key={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCrypto === crypto
                        ? 'bg-orange-500 text-white shadow-lg'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {crypto}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rates).map(([crypto, rate]) => (
                <div key={crypto} className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'} rounded-xl p-4 ${selectedCrypto === crypto ? 'ring-2 ring-orange-500' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{crypto}</h4>
                    <div className="text-green-500 text-sm">+2.5%</div>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>NGN: ₦{rate.NGN.toLocaleString()}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>KES: KSh{rate.KES.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Trade */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm border-gray-200'} rounded-2xl shadow-xl p-6 border`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Quick Trade</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    tradeType === 'buy'
                      ? 'bg-green-500 text-white shadow-lg'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    tradeType === 'sell'
                      ? 'bg-red-500 text-white shadow-lg'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Sell
                </button>
              </div>
              
              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDT">Tether (USDT)</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
              />

              <select
                value={tradeCurrency}
                onChange={(e) => setTradeCurrency(e.target.value)}
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
              >
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="KES">Kenyan Shillings (KES)</option>
              </select>

              <button
                onClick={handleQuickTrade}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 ${
                  tradeType === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'
                }`}
              >
                {tradeType === 'buy' ? '🚀 Buy Now' : '💰 Sell Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Portfolio', desc: 'View holdings', icon: '📊', color: 'from-blue-500 to-cyan-600', action: () => router.push('/portfolio') },
            { title: 'History', desc: 'Trade records', icon: '📈', color: 'from-purple-500 to-indigo-600', action: () => router.push('/trade-history') },
            { title: 'Deposit', desc: 'Add funds', icon: '💳', color: 'from-green-500 to-emerald-600', action: () => setShowQuickTrade(true) },
            { title: 'Support', desc: 'Get help', icon: '💬', color: 'from-orange-500 to-red-600', action: () => window.open('https://t.me/bpaysupport', '_blank') }
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white'} rounded-2xl shadow-lg p-6 border transition-all hover:scale-105 hover:shadow-xl`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl mb-4 mx-auto`}>
                {item.icon}
              </div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{item.title}</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}