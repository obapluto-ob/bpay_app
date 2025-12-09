import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/mobile-exact-dashboard');
  }, [router]);
  
  return null;
}

// Full mobile functionality with proper sell screen
function FullMobileDashboard() {
  // Implementation moved to mobile-exact-dashboard.tsx
  return null;
}

// Legacy dashboard - keeping for reference
function LegacyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
  const [rates, setRates] = useState({ BTC: { NGN: 0, KES: 0 }, ETH: { NGN: 0, KES: 0 }, USDT: { NGN: 0, KES: 0 } });
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeCurrency, setTradeCurrency] = useState('NGN');
  const [priceHistory, setPriceHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileRes = await fetch(`${API_BASE}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData);
        }

        // Fetch balance
        const balanceRes = await fetch(`${API_BASE}/user/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        }

        // Fetch rates
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

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getKYCStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Verified';
      case 'processing': return 'Processing';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BPay Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/5782897843587714011_120.jpg" 
                alt="BPay" 
                className="w-10 h-10 rounded-full"
              />
              <h1 className="text-xl font-bold text-gray-900">BPay Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.fullName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* User Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-600">Country: {user?.kycStatus === 'approved' ? (user?.country === 'NG' ? 'Nigeria' : 'Kenya') : 'Will be set during KYC'}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(user?.kycStatus)}`}>
                KYC: {getKYCStatusText(user?.kycStatus)}
              </div>
              {user?.kycStatus === 'pending' && (
                <button
                  onClick={() => setShowKYCModal(true)}
                  className="block mt-2 text-sm text-orange-600 hover:text-orange-700"
                >
                  Complete KYC
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">NGN Balance</h3>
            <p className="text-2xl font-bold text-gray-900">₦{balance.NGN.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">KES Balance</h3>
            <p className="text-2xl font-bold text-gray-900">KSh{balance.KES.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Bitcoin</h3>
            <p className="text-2xl font-bold text-gray-900">{balance.BTC.toFixed(8)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Ethereum</h3>
            <p className="text-2xl font-bold text-gray-900">{balance.ETH.toFixed(6)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">USDT</h3>
            <p className="text-2xl font-bold text-gray-900">{balance.USDT.toFixed(2)}</p>
          </div>
        </div>

        {/* Live Rates */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Crypto Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(rates).map(([crypto, rate]) => (
              <div key={crypto} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{crypto}</h4>
                <p className="text-sm text-gray-600">NGN: ₦{rate.NGN.toLocaleString()}</p>
                <p className="text-sm text-gray-600">KES: KSh{rate.KES.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button
            onClick={() => setShowBuyModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Buy Crypto</h3>
            <p className="text-sm opacity-90">Purchase Bitcoin, Ethereum, or USDT</p>
          </button>
          
          <button
            onClick={() => setShowSellModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Sell Crypto</h3>
            <p className="text-sm opacity-90">Convert crypto to cash</p>
          </button>
          
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Deposit</h3>
            <p className="text-sm opacity-90">Add funds to your wallet</p>
          </button>
          
          <button
            onClick={() => router.push('/trade-history')}
            className="bg-gray-500 hover:bg-gray-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Trade History</h3>
            <p className="text-sm opacity-90">View all transactions</p>
          </button>
        </div>

        {/* KYC Modal */}
        {showKYCModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Complete KYC Verification</h3>
              <p className="text-sm text-gray-600 mb-4">
                To use BPay services, please complete your KYC verification. This helps us comply with regulations and keep your account secure.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>National ID</option>
                    <option>Passport</option>
                    <option>Driver's License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter document number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowKYCModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('KYC submitted for review');
                    setShowKYCModal(false);
                  }}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600"
                >
                  Submit KYC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buy Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Buy Crypto</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the mobile app for the complete buy experience with real-time admin chat and payment verification.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open('https://expo.dev/@yourusername/bpay-mobile', '_blank')}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600"
                >
                  Open Mobile App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sell Modal */}
        {showSellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Sell Crypto</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the mobile app for the complete sell experience with escrow protection and admin verification.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open('https://expo.dev/@yourusername/bpay-mobile', '_blank')}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600"
                >
                  Open Mobile App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Deposit Funds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="NGN">Nigerian Naira (NGN)</option>
                    <option value="KES">Kenyan Shillings (KES)</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Bank Details</h4>
                  <p className="text-sm text-gray-600">
                    GTBank<br/>
                    Account: 0123456789<br/>
                    BPay Technologies Ltd
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Deposit request submitted');
                    setShowDepositModal(false);
                  }}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600"
                >
                  Submit Deposit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}