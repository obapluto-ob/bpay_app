import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState({ NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 });
  const [rates, setRates] = useState({ BTC: { NGN: 0, KES: 0 }, ETH: { NGN: 0, KES: 0 }, USDT: { NGN: 0, KES: 0 } });
  const [usdRates, setUsdRates] = useState<Record<string, number>>({});
  const [exchangeRates, setExchangeRates] = useState({ USDNGN: 1600, USDKES: 150 });
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<'nigeria' | 'kenya' | 'crypto'>('crypto');
  const [activeCountry, setActiveCountry] = useState<'NG' | 'KE'>('NG');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showBuyScreen, setShowBuyScreen] = useState(false);
  const [showSellScreen, setShowSellScreen] = useState(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState(false);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
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

    const fetchUsdRates = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
        const data = await response.json();
        const newRates = {
          BTC: data.bitcoin?.usd || 95000,
          ETH: data.ethereum?.usd || 3400,
          USDT: data.tether?.usd || 1,
        };
        setUsdRates(newRates);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.log('Failed to fetch USD rates');
      }
    };

    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRates({
          USDNGN: data.rates?.NGN || 1600,
          USDKES: data.rates?.KES || 150,
        });
      } catch (error) {
        setExchangeRates({ USDNGN: 1600, USDKES: 150 });
      }
    };

    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('userFullName');
    if (savedEmail) setEmail(savedEmail);
    if (savedName) setFullName(savedName);

    fetchData();
    fetchUsdRates();
    fetchExchangeRates();

    const interval = setInterval(fetchUsdRates, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  const CryptoIcon = ({ crypto, size = 32 }: { crypto: string; size?: number }) => {
    const colors = {
      BTC: '#f7931a',
      ETH: '#627eea', 
      USDT: '#26a17b'
    };
    
    return (
      <div 
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: colors[crypto as keyof typeof colors] || '#64748b',
          fontSize: size * 0.4
        }}
      >
        {crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '$'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white text-lg">Loading BPay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-800 pt-12 pb-5 px-5 rounded-b-3xl shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {fullName?.[0] || email?.[0] || 'U'}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Welcome back</p>
              <p className="text-white text-lg font-bold">{fullName || email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 bg-slate-700 rounded-full"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-100 flex-1 rounded-t-3xl -mt-3 min-h-screen">
        <div className="p-5 pt-6">
          {/* Balance Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Balances</h2>
            
            {/* Account Tabs */}
            <div className="flex bg-slate-200 rounded-xl p-1 mb-4">
              <button
                onClick={() => setSelectedAccount('crypto')}
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedAccount === 'crypto'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-slate-600'
                }`}
              >
                <span className="font-mono">₿</span> Crypto
              </button>
              <button
                onClick={() => {
                  setSelectedAccount('nigeria');
                  setActiveCountry('NG');
                }}
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedAccount === 'nigeria'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-slate-600'
                }`}
              >
                NG Nigeria
              </button>
              <button
                onClick={() => {
                  setSelectedAccount('kenya');
                  setActiveCountry('KE');
                }}
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedAccount === 'kenya'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-slate-600'
                }`}
              >
                KE Kenya
              </button>
            </div>

            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-transparent">
              {selectedAccount === 'crypto' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-bold mr-2 bg-orange-500 text-white px-2 py-1 rounded">₿</span>
                    <span className="text-slate-600 font-semibold">Crypto Assets</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CryptoIcon crypto="BTC" size={16} />
                      <span className="text-slate-900 font-semibold">{balance.BTC?.toFixed(6) || '0.000000'} BTC</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CryptoIcon crypto="ETH" size={16} />
                      <span className="text-slate-900 font-semibold">{balance.ETH?.toFixed(4) || '0.0000'} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CryptoIcon crypto="USDT" size={16} />
                      <span className="text-slate-900 font-semibold">{balance.USDT?.toFixed(2) || '0.00'} USDT</span>
                    </div>
                  </div>
                </>
              )}
              
              {selectedAccount === 'nigeria' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-bold mr-2 bg-green-600 text-white px-2 py-1 rounded">NG</span>
                    <span className="text-slate-600 font-semibold">Nigeria</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-900">₦{balance.NGN?.toLocaleString() || '0'}</span>
                </>
              )}
              
              {selectedAccount === 'kenya' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-bold mr-2 bg-red-600 text-white px-2 py-1 rounded">KE</span>
                    <span className="text-slate-600 font-semibold">Kenya</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-900">KSh{balance.KES?.toLocaleString() || '0'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="flex justify-around px-2">
              {selectedAccount === 'crypto' ? (
                <>
                  <button 
                    onClick={() => setShowSellScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Sell</span>
                  </button>
                  <button 
                    onClick={() => setShowWalletScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Deposit</span>
                  </button>
                  <button 
                    onClick={() => setShowWalletScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Wallet</span>
                  </button>
                  <button 
                    onClick={() => alert('Convert feature - Coming soon!')}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Convert</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowBuyScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Buy Crypto</span>
                  </button>
                  <button 
                    onClick={() => alert('Add Funds - Bank transfer details will be shown')}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px] hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs text-slate-900 font-semibold">Add Funds</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Rates */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Live Rates</h2>
              <div className="text-right">
                <p className="text-xs text-slate-600">
                  {lastUpdate ? `Updated ${lastUpdate}` : 'Loading...'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(rates).map(([crypto, rate]) => (
                <div key={crypto} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <CryptoIcon crypto={crypto} size={32} />
                    <div>
                      <p className="font-bold text-slate-900">{crypto}</p>
                      <p className="text-xs text-slate-600">
                        {crypto === 'BTC' ? 'Bitcoin' : crypto === 'ETH' ? 'Ethereum' : 'Tether'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${usdRates[crypto]?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedAccount === 'crypto' ? 
                        `$${usdRates[crypto]?.toLocaleString() || '0'}` :
                        `${activeCountry === 'NG' ? '₦' : 'KSh'}${((usdRates[crypto] || 0) * (activeCountry === 'NG' ? exchangeRates.USDNGN : exchangeRates.USDKES)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </p>
                    <p className="text-xs text-slate-600">Live</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl">
          <div className="flex py-3 px-2">
            <button 
              onClick={() => setActiveTab('home')}
              className="flex-1 flex flex-col items-center py-2 px-1"
            >
              <svg className={`w-5 h-5 mb-1 ${activeTab === 'home' ? 'text-orange-500' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              <span className={`text-xs font-medium ${activeTab === 'home' ? 'text-orange-500' : 'text-slate-500'}`}>Home</span>
            </button>
            
            {selectedAccount === 'crypto' && (
              <button 
                onClick={() => {
                  setActiveTab('sell');
                  setShowSellScreen(true);
                }}
                className="flex-1 flex flex-col items-center py-2 px-1"
              >
                <svg className={`w-5 h-5 mb-1 ${activeTab === 'sell' ? 'text-orange-500' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className={`text-xs font-medium ${activeTab === 'sell' ? 'text-orange-500' : 'text-slate-500'}`}>Sell</span>
              </button>
            )}
            
            {selectedAccount !== 'crypto' && (
              <button 
                onClick={() => {
                  setActiveTab('buy');
                  setShowBuyScreen(true);
                }}
                className="flex-1 flex flex-col items-center py-2 px-1"
              >
                <svg className={`w-5 h-5 mb-1 ${activeTab === 'buy' ? 'text-orange-500' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                <span className={`text-xs font-medium ${activeTab === 'buy' ? 'text-orange-500' : 'text-slate-500'}`}>Buy</span>
              </button>
            )}
            
            <button 
              onClick={() => {
                setActiveTab('history');
                setShowHistoryScreen(true);
              }}
              className="flex-1 flex flex-col items-center py-2 px-1"
            >
              <svg className={`w-5 h-5 mb-1 ${activeTab === 'history' ? 'text-orange-500' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className={`text-xs font-medium ${activeTab === 'history' ? 'text-orange-500' : 'text-slate-500'}`}>History</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center py-2 px-1"
            >
              <svg className="w-5 h-5 text-slate-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-medium text-slate-500">Profile</span>
            </button>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-11/12 max-w-md max-h-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 bg-slate-100 rounded-full"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-slate-600">No notifications</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-20"></div>
      </div>

      {/* Buy Screen Modal */}
      {showBuyScreen && (
        <div className="fixed inset-0 bg-slate-800 z-50">
          <div className="p-5 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Buy Crypto</h1>
              <button
                onClick={() => {
                  setShowBuyScreen(false);
                  setActiveTab('home');
                }}
                className="p-2 bg-slate-700 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <p className="text-center text-slate-600 mb-4">Use mobile app for complete buy experience with real-time admin chat and payment verification.</p>
              <button 
                onClick={() => window.open('https://expo.dev/@yourusername/bpay-mobile', '_blank')}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Open Mobile App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Screen Modal */}
      {showSellScreen && (
        <div className="fixed inset-0 bg-slate-800 z-50">
          <div className="p-5 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Sell Crypto</h1>
              <button
                onClick={() => {
                  setShowSellScreen(false);
                  setActiveTab('home');
                }}
                className="p-2 bg-slate-700 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <p className="text-center text-slate-600 mb-4">Use mobile app for complete sell experience with escrow protection and admin verification.</p>
              <button 
                onClick={() => window.open('https://expo.dev/@yourusername/bpay-mobile', '_blank')}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Open Mobile App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Screen Modal */}
      {showHistoryScreen && (
        <div className="fixed inset-0 bg-slate-800 z-50">
          <div className="p-5 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Trade History</h1>
              <button
                onClick={() => {
                  setShowHistoryScreen(false);
                  setActiveTab('home');
                }}
                className="p-2 bg-slate-700 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <p className="text-center text-slate-600 mb-4">No trade history found. Start trading to see your transaction history here.</p>
              <button 
                onClick={() => {
                  setShowHistoryScreen(false);
                  setShowBuyScreen(true);
                  setActiveTab('buy');
                }}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Start Trading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Screen Modal */}
      {showWalletScreen && (
        <div className="fixed inset-0 bg-slate-800 z-50">
          <div className="p-5 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Crypto Wallet</h1>
              <button
                onClick={() => setShowWalletScreen(false)}
                className="p-2 bg-slate-700 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {['BTC', 'ETH', 'USDT'].map((crypto) => (
                <div key={crypto} className="bg-white rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <CryptoIcon crypto={crypto} size={40} />
                      <div>
                        <h3 className="font-bold text-slate-900">{crypto}</h3>
                        <p className="text-sm text-slate-600">
                          {crypto === 'BTC' ? 'Bitcoin' : crypto === 'ETH' ? 'Ethereum' : 'Tether'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {crypto === 'BTC' ? balance.BTC?.toFixed(6) : 
                         crypto === 'ETH' ? balance.ETH?.toFixed(4) : 
                         balance.USDT?.toFixed(2)} {crypto}
                      </p>
                      <p className="text-sm text-slate-600">
                        ${((crypto === 'BTC' ? balance.BTC : crypto === 'ETH' ? balance.ETH : balance.USDT) * (usdRates[crypto] || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold">
                      Receive
                    </button>
                    <button className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold">
                      Send
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}