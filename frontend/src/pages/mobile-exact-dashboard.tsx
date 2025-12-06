import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

// Crypto Icon Component
const CryptoIcon = ({ crypto, size = 32 }: { crypto: string; size?: number }) => {
  if (crypto === 'BTC') {
    return (
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
          <circle cx="16" cy="16" r="16" fill="#f7931a"/>
          <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" fill="white"/>
        </svg>
      </div>
    );
  }
  if (crypto === 'ETH') {
    return (
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
          <circle cx="16" cy="16" r="16" fill="#627eea"/>
          <path d="M16.498 4v8.87l7.497 3.35-7.497-12.22z" fill="white" fillOpacity="0.602"/>
          <path d="M16.498 4L9 16.22l7.498-3.35V4z" fill="white"/>
          <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fill="white" fillOpacity="0.602"/>
          <path d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z" fill="white"/>
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fill="white" fillOpacity="0.2"/>
          <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fill="white" fillOpacity="0.602"/>
        </svg>
      </div>
    );
  }
  if (crypto === 'USDT') {
    return (
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
          <circle cx="16" cy="16" r="16" fill="#26a17b"/>
          <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white"/>
        </svg>
      </div>
    );
  }
  return null;
};

// Full Buy Crypto Component
const BuyCryptoWeb = ({ rates, usdRates, exchangeRates, userBalance, selectedCurrency, onClose }: any) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'mobile'>('bank');
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', bankName: '' });
  const [loading, setLoading] = useState(false);
  const [orderStep, setOrderStep] = useState<'create' | 'payment'>('create');

  const baseRate = (usdRates[selectedCrypto] || 0) * (selectedCurrency === 'NGN' ? exchangeRates.USDNGN : exchangeRates.USDKES);
  const buyMargin = 0.02;
  const currentRate = Math.round(baseRate * (1 + buyMargin));
  const cryptoAmount = parseFloat(amount || '0') / currentRate;

  const handleCreateOrder = async () => {
    if (!amount) {
      alert('Please enter amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'buy',
          crypto: selectedCrypto,
          fiatAmount: parseFloat(amount),
          cryptoAmount,
          paymentMethod,
          country: selectedCurrency === 'NGN' ? 'NG' : 'KE'
        })
      });

      if (response.ok) {
        setOrderStep('payment');
        alert('Buy order created! Make payment to complete.');
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center space-y-2 ${
              selectedCrypto === crypto ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <CryptoIcon crypto={crypto} size={24} />
            <span className="font-semibold">{crypto}</span>
          </button>
        ))}
      </div>

      <div className="text-center p-3 bg-slate-100 rounded-xl">
        <p className="text-slate-600">Buy Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{currentRate.toLocaleString()} per {selectedCrypto}</p>
      </div>

      <input
        type="number"
        placeholder={`${selectedCurrency} amount to spend`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-3 border border-slate-300 rounded-xl"
      />

      {amount && parseFloat(amount) > 0 && (
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-green-600 font-bold">You'll receive: {cryptoAmount.toFixed(8)} {selectedCrypto}</p>
        </div>
      )}

      {orderStep === 'create' && (
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? 'Creating Order...' : 'Create Buy Order'}
        </button>
      )}

      {orderStep === 'payment' && (
        <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500">
          <h3 className="font-bold text-orange-600 mb-2">Make Payment</h3>
          <p className="text-sm text-slate-600 mb-4">
            Transfer {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{parseFloat(amount).toLocaleString()} to complete your order.
          </p>
          <div className="bg-white p-3 rounded-xl mb-4">
            <p className="font-bold">Bank Details:</p>
            <p>GTBank - 0123456789</p>
            <p>BPay Technologies Ltd</p>
          </div>
          <button
            onClick={() => alert('Payment submitted - awaiting verification')}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
          >
            I Have Made Payment
          </button>
        </div>
      )}
    </div>
  );
};

// Full Sell Crypto Component
const SellCryptoWeb = ({ rates, usdRates, exchangeRates, userBalance, onClose }: any) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'KES'>('NGN');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'mobile'>('bank');
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', bankName: '' });
  const [loading, setLoading] = useState(false);
  const [orderStep, setOrderStep] = useState<'create' | 'escrow' | 'transfer'>('create');

  const baseRate = (usdRates[selectedCrypto] || 0) * (selectedCurrency === 'NGN' ? exchangeRates.USDNGN : exchangeRates.USDKES);
  const sellMargin = 0.02;
  const currentRate = Math.round(baseRate * (1 - sellMargin));
  const fiatAmount = parseFloat(amount || '0') * currentRate;

  const handleCreateOrder = async () => {
    if (!amount || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
      alert('Please fill all fields');
      return;
    }

    const cryptoAmount = parseFloat(amount);
    const availableBalance = userBalance[selectedCrypto] || 0;
    
    if (cryptoAmount > availableBalance) {
      alert(`Insufficient balance. You have ${availableBalance.toFixed(8)} ${selectedCrypto}`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'sell',
          crypto: selectedCrypto,
          cryptoAmount,
          fiatAmount,
          paymentMethod,
          country: selectedCurrency === 'NGN' ? 'NG' : 'KE',
          bankDetails
        })
      });

      if (response.ok) {
        setOrderStep('escrow');
        alert('Sell order created successfully!');
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Crypto Selector */}
      <div className="flex space-x-2">
        {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center space-y-2 ${
              selectedCrypto === crypto ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <CryptoIcon crypto={crypto} size={24} />
            <span className="font-semibold">{crypto}</span>
          </button>
        ))}
      </div>

      {/* Rate Display */}
      <div className="text-center p-3 bg-slate-100 rounded-xl">
        <p className="text-slate-600">Sell Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{currentRate.toLocaleString()} per {selectedCrypto}</p>
      </div>

      {/* Amount Input */}
      <div className="flex space-x-2">
        <input
          type="number"
          placeholder={`${selectedCrypto} amount to sell`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 p-3 border border-slate-300 rounded-xl"
        />
        <button
          onClick={() => setAmount((userBalance[selectedCrypto] || 0).toString())}
          className="bg-green-500 text-white px-4 py-3 rounded-xl font-semibold"
        >
          MAX
        </button>
      </div>

      {/* Balance Info */}
      <div className="bg-green-50 p-3 rounded-xl border-l-4 border-green-500">
        <p className="text-sm text-slate-600">Available Balance:</p>
        <p className="font-bold text-green-600">{(userBalance[selectedCrypto] || 0).toFixed(8)} {selectedCrypto}</p>
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="text-center p-3 bg-orange-50 rounded-xl">
          <p className="text-orange-600 font-bold">You'll receive: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{fiatAmount.toLocaleString()}</p>
        </div>
      )}

      {/* Currency Selector */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900">Select Currency</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCurrency('NGN')}
            className={`flex-1 p-3 rounded-xl flex items-center justify-center space-x-2 ${
              selectedCurrency === 'NGN' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <span>🇳🇬</span>
            <span>Nigerian Naira</span>
          </button>
          <button
            onClick={() => setSelectedCurrency('KES')}
            className={`flex-1 p-3 rounded-xl flex items-center justify-center space-x-2 ${
              selectedCurrency === 'KES' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <span>🇰🇪</span>
            <span>Kenyan Shilling</span>
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900">Payment Method</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`flex-1 p-3 rounded-xl ${
              paymentMethod === 'bank' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            Bank Account
          </button>
          <button
            onClick={() => setPaymentMethod('mobile')}
            className={`flex-1 p-3 rounded-xl ${
              paymentMethod === 'mobile' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            {selectedCurrency === 'NGN' ? 'Mobile Wallet' : 'Mobile Money'}
          </button>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">
          {paymentMethod === 'bank' ? 'Bank Details' : (selectedCurrency === 'NGN' ? 'Mobile Wallet Details' : 'Mobile Money Details')}
        </h3>
        <input
          type="text"
          placeholder={paymentMethod === 'bank' ? 'Account Name' : 'Full Name'}
          value={bankDetails.accountName}
          onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
          className="w-full p-3 border border-slate-300 rounded-xl"
        />
        <input
          type="text"
          placeholder={paymentMethod === 'bank' ? 'Account Number' : 'Phone Number'}
          value={bankDetails.accountNumber}
          onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
          className="w-full p-3 border border-slate-300 rounded-xl"
        />
        <input
          type="text"
          placeholder={paymentMethod === 'bank' ? 'Bank Name' : (selectedCurrency === 'NGN' ? 'Wallet Provider (OPay, PalmPay, etc.)' : 'Provider (M-Pesa, Airtel, etc.)')}
          value={bankDetails.bankName}
          onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
          className="w-full p-3 border border-slate-300 rounded-xl"
        />
      </div>

      {orderStep === 'create' && (
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full bg-red-500 text-white py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? 'Creating Order...' : 'Create Sell Order'}
        </button>
      )}

      {orderStep === 'escrow' && (
        <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
          <h3 className="font-bold text-green-600 mb-2">Order Created Successfully!</h3>
          <p className="text-sm text-slate-600 mb-4">
            Your sell order has been created. An admin will contact you shortly to verify the transaction.
          </p>
          <button
            onClick={() => alert('Chat with admin feature - Coming soon!')}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold"
          >
            💬 Chat with Admin
          </button>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Your crypto will be held in escrow until payment is processed. Funds are released to your account within 1-24 hours.
      </p>
    </div>
  );
};

export default function MobileExactDashboard() {
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
  const [activeTab, setActiveTab] = useState('home');
  const [showBuyScreen, setShowBuyScreen] = useState(false);
  const [showSellScreen, setShowSellScreen] = useState(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState(false);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
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

  if (showBuyScreen || showSellScreen || showHistoryScreen || showWalletScreen || showProfileScreen) {
    return (
      <div className="min-h-screen bg-slate-800">
        <div className="p-5 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">
              {showBuyScreen ? 'Buy Crypto' : 
               showSellScreen ? 'Sell Crypto' :
               showHistoryScreen ? 'Trade History' :
               showWalletScreen ? 'Crypto Wallet' : 'Profile'}
            </h1>
            <button
              onClick={() => {
                setShowBuyScreen(false);
                setShowSellScreen(false);
                setShowHistoryScreen(false);
                setShowWalletScreen(false);
                setShowProfileScreen(false);
                setActiveTab('home');
              }}
              className="p-2 bg-slate-700 rounded-full"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>

          {showProfileScreen && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {fullName?.[0] || email?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{fullName || 'User'}</h2>
                    <p className="text-slate-600">{email}</p>
                    <p className="text-sm text-slate-500">
                      Country: {user?.kycStatus === 'approved' ? (user?.country === 'NG' ? 'Nigeria' : 'Kenya') : 'Will be set during KYC'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold">
                    KYC Verification
                  </button>
                  <button className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold">
                    Security Settings
                  </button>
                  <button className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold">
                    Support
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {showWalletScreen && (
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
          )}

          {showBuyScreen && (
            <BuyCryptoWeb 
              rates={rates}
              usdRates={usdRates}
              exchangeRates={exchangeRates}
              userBalance={balance}
              selectedCurrency={activeCountry === 'NG' ? 'NGN' : 'KES'}
              onClose={() => {
                setShowBuyScreen(false);
                setActiveTab('home');
              }}
            />
          )}

          {showSellScreen && (
            <SellCryptoWeb 
              rates={rates}
              usdRates={usdRates}
              exchangeRates={exchangeRates}
              userBalance={balance}
              onClose={() => {
                setShowSellScreen(false);
                setActiveTab('home');
              }}
            />
          )}

          {showHistoryScreen && (
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header - Exact mobile style */}
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
          {/* Balance Section - Exact mobile style */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Balances</h2>
            
            {/* Account Tabs - Exact mobile style */}
            <div className="flex bg-slate-200 rounded-xl p-1 mb-4">
              <button
                onClick={() => setSelectedAccount('crypto')}
                className={`flex-1 py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedAccount === 'crypto'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-slate-600'
                }`}
              >
                ₿ Crypto
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
                🇳🇬 Nigeria
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
                🇰🇪 Kenya
              </button>
            </div>

            {/* Balance Card - Exact mobile style */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-transparent">
              {selectedAccount === 'crypto' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">₿</span>
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
                    <span className="text-2xl mr-2">🇳🇬</span>
                    <span className="text-slate-600 font-semibold">Nigeria</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-900">₦{balance.NGN?.toLocaleString() || '0'}</span>
                </>
              )}
              
              {selectedAccount === 'kenya' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">🇰🇪</span>
                    <span className="text-slate-600 font-semibold">Kenya</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-900">KSh{balance.KES?.toLocaleString() || '0'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions - Exact mobile style */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="flex justify-around px-2">
              {selectedAccount === 'crypto' ? (
                <>
                  <button 
                    onClick={() => setShowSellScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">↓</span>
                    <span className="text-xs text-slate-900 font-semibold">Sell</span>
                  </button>
                  <button 
                    onClick={() => setShowWalletScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">+</span>
                    <span className="text-xs text-slate-900 font-semibold">Deposit</span>
                  </button>
                  <button 
                    onClick={() => setShowWalletScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">₿</span>
                    <span className="text-xs text-slate-900 font-semibold">Wallet</span>
                  </button>
                  <button 
                    onClick={() => alert('Convert feature - Coming soon!')}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">⇄</span>
                    <span className="text-xs text-slate-900 font-semibold">Convert</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowBuyScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">↑</span>
                    <span className="text-xs text-slate-900 font-semibold">Buy Crypto</span>
                  </button>
                  <button 
                    onClick={() => {
                      alert(`Add Funds to ${selectedAccount === 'nigeria' ? 'NGN' : 'KES'} Account\n\nBank Details:\nGTBank - 0123456789\nBPay Technologies Ltd\n\nTransfer funds and contact support for confirmation.`);
                    }}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">+</span>
                    <span className="text-xs text-slate-900 font-semibold">Add Funds</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Rates - Exact mobile style */}
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

        {/* Bottom Navigation - Exact mobile style */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl">
          <div className="flex py-3 px-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex-1 flex flex-col items-center py-2 px-1 ${activeTab === 'home' ? 'bg-orange-50 rounded-lg' : ''}`}
            >
              <svg className={`w-5 h-5 mb-1`} fill="none" stroke={activeTab === 'home' ? '#f59e0b' : '#64748b'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
              </svg>
              <span className={`text-xs font-medium ${activeTab === 'home' ? 'text-orange-500' : 'text-slate-500'}`}>Home</span>
            </button>
            
            {selectedAccount === 'crypto' && (
              <button 
                onClick={() => {
                  setActiveTab('sell');
                  setShowSellScreen(true);
                }}
                className={`flex-1 flex flex-col items-center py-2 px-1 ${activeTab === 'sell' ? 'bg-orange-50 rounded-lg' : ''}`}
              >
                <svg className={`w-5 h-5 mb-1`} fill="none" stroke={activeTab === 'sell' ? '#f59e0b' : '#64748b'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M19 12l-7 7-7-7" />
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
                className={`flex-1 flex flex-col items-center py-2 px-1 ${activeTab === 'buy' ? 'bg-orange-50 rounded-lg' : ''}`}
              >
                <svg className={`w-5 h-5 mb-1`} fill="none" stroke={activeTab === 'buy' ? '#f59e0b' : '#64748b'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span className={`text-xs font-medium ${activeTab === 'buy' ? 'text-orange-500' : 'text-slate-500'}`}>Buy</span>
              </button>
            )}
            
            <button 
              onClick={() => {
                setActiveTab('history');
                setShowHistoryScreen(true);
              }}
              className={`flex-1 flex flex-col items-center py-2 px-1 ${activeTab === 'history' ? 'bg-orange-50 rounded-lg' : ''}`}
            >
              <svg className={`w-5 h-5 mb-1`} fill="none" stroke={activeTab === 'history' ? '#f59e0b' : '#64748b'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v5h5M3.05 13a9 9 0 1 0 2.5-9.5" />
              </svg>
              <span className={`text-xs font-medium ${activeTab === 'history' ? 'text-orange-500' : 'text-slate-500'}`}>History</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('profile');
                setShowProfileScreen(true);
              }}
              className={`flex-1 flex flex-col items-center py-2 px-1 ${activeTab === 'profile' ? 'bg-orange-50 rounded-lg' : ''}`}
            >
              <svg className={`w-5 h-5 mb-1`} fill="none" stroke={activeTab === 'profile' ? '#f59e0b' : '#64748b'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              <span className={`text-xs font-medium ${activeTab === 'profile' ? 'text-orange-500' : 'text-slate-500'}`}>Profile</span>
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
                  <span className="text-slate-600 font-bold">✕</span>
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
    </div>
  );
}