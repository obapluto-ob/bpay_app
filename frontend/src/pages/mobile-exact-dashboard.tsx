import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

// Full Buy Crypto Component  
const BuyCryptoWeb = ({ rates, usdRates, exchangeRates, userBalance, selectedCurrency, onClose }: any) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'bank'>('balance');
  const [loading, setLoading] = useState(false);
  const [orderStep, setOrderStep] = useState<'create' | 'escrow' | 'payment' | 'waiting'>('create');
  const [lockedRate, setLockedRate] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [orderId, setOrderId] = useState<string | null>(null);

  const baseRate = (usdRates[selectedCrypto] || 0) * (selectedCurrency === 'NGN' ? exchangeRates.USDNGN : exchangeRates.USDKES);
  const buyMargin = 0.02;
  const currentRate = lockedRate || Math.round(baseRate * (1 + buyMargin));
  const cryptoAmount = parseFloat(amount || '0') / currentRate;
  const availableBalance = selectedCurrency === 'NGN' ? userBalance?.NGN || 0 : userBalance?.KES || 0;

  const limits = {
    BTC: { minUSD: 10, maxUSD: 50000 },
    ETH: { minUSD: 5, maxUSD: 30000 },
    USDT: { minUSD: 1, maxUSD: 100000 }
  };

  const exchangeRate = selectedCurrency === 'NGN' ? exchangeRates.USDNGN : exchangeRates.USDKES;
  const minAmount = limits[selectedCrypto].minUSD * exchangeRate;
  const maxAmount = limits[selectedCrypto].maxUSD * exchangeRate;

  const handleCreateOrder = async () => {
    if (!amount) {
      alert('Please enter amount');
      return;
    }

    const amountNum = parseFloat(amount);
    
    if (amountNum < minAmount) {
      alert(`Minimum ${selectedCrypto} purchase is ${selectedCurrency === 'NGN' ? '₦' : 'KSh'}${minAmount.toLocaleString()}`);
      return;
    }
    
    if (amountNum > maxAmount) {
      alert(`Maximum ${selectedCrypto} purchase is ${selectedCurrency === 'NGN' ? '₦' : 'KSh'}${maxAmount.toLocaleString()}`);
      return;
    }

    if (paymentMethod === 'balance') {
      if (availableBalance === 0) {
        alert('Your wallet is empty. Please use Bank Transfer.');
        setPaymentMethod('bank');
        return;
      }
      if (amountNum > availableBalance) {
        alert(`Insufficient funds. You have ${selectedCurrency === 'NGN' ? '₦' : 'KSh'}${availableBalance.toLocaleString()}`);
        return;
      }
    }

    if (!lockedRate) {
      setLockedRate(currentRate);
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
          fiatAmount: amountNum,
          cryptoAmount,
          paymentMethod,
          country: selectedCurrency === 'NGN' ? 'NG' : 'KE'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOrderId(data.trade?.id || 'ORDER_' + Date.now());
        setOrderStep('escrow');
        
        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              alert('Order expired');
              setOrderStep('create');
              return 900;
            }
            return prev - 1;
          });
        }, 1000);
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
            <span className="text-2xl">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
            <span className="font-semibold">{crypto}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="font-bold text-slate-900">Payment Method</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (availableBalance === 0) {
                alert('Your wallet is empty. Please use Bank Transfer.');
              } else {
                setPaymentMethod('balance');
              }
            }}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center ${
              paymentMethod === 'balance' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            } ${availableBalance === 0 ? 'opacity-50' : ''}`}
          >
            <span className="text-lg mb-1">{selectedCurrency === 'NGN' ? '🇳🇬' : '🇰🇪'}</span>
            <span className="font-semibold text-sm">Wallet Balance</span>
            <span className="text-xs">{selectedCurrency === 'NGN' ? '₦' : 'KSh'}{availableBalance.toLocaleString()}</span>
          </button>
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center ${
              paymentMethod === 'bank' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <span className="text-lg mb-1">🏦</span>
            <span className="font-semibold text-sm">Bank Transfer</span>
            <span className="text-xs">1-24 hours</span>
          </button>
        </div>
      </div>

      <div className="text-center p-3 bg-slate-100 rounded-xl">
        <p className="text-slate-600">
          {lockedRate ? (
            <>🔒 Locked Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{lockedRate.toLocaleString()} per {selectedCrypto}</>
          ) : (
            <>Live Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{currentRate.toLocaleString()} per {selectedCrypto}</>
          )}
        </p>
      </div>

      <input
        type="number"
        placeholder={`${selectedCurrency} amount to spend`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-3 border border-slate-300 rounded-xl"
      />
      
      <p className="text-xs text-slate-500 text-center">
        Min: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{minAmount.toLocaleString()} | 
        Max: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{maxAmount.toLocaleString()}
      </p>

      {amount && parseFloat(amount) > 0 && (
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-green-600 font-bold">You'll receive: {cryptoAmount.toFixed(8)} {selectedCrypto}</p>
        </div>
      )}

      {paymentMethod === 'balance' && parseFloat(amount || '0') > availableBalance && (
        <div className="bg-red-50 p-3 rounded-xl border-l-4 border-red-500">
          <p className="text-red-600 text-sm">⚠️ Insufficient balance. Use Bank Transfer or deposit funds.</p>
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
      
      {orderStep === 'escrow' && (
        <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
          <h3 className="font-bold text-green-600 mb-2">Order Created Successfully</h3>
          <p className="text-sm text-slate-600 mb-4">
            Complete payment within: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </p>
          <div className="space-y-2 mb-4">
            <p><span className="font-semibold">Order ID:</span> #{orderId}</p>
            <p><span className="font-semibold">Amount:</span> {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{parseFloat(amount).toLocaleString()}</p>
            <p><span className="font-semibold">You'll receive:</span> {cryptoAmount.toFixed(8)} {selectedCrypto}</p>
          </div>
          <button
            onClick={() => setOrderStep('payment')}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold"
          >
            Proceed to Payment
          </button>
        </div>
      )}
      
      {orderStep === 'payment' && (
        <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500">
          <h3 className="font-bold text-orange-600 mb-2">Complete Payment</h3>
          {paymentMethod === 'bank' && (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Transfer {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{parseFloat(amount).toLocaleString()} to complete your order.
              </p>
              <div className="bg-white p-3 rounded-xl mb-4">
                <p className="font-bold">Bank Details:</p>
                <p>GTBank - 0123456789</p>
                <p>BPay Technologies Ltd</p>
              </div>
            </>
          )}
          <button
            onClick={() => {
              setOrderStep('waiting');
              alert('Payment submitted - awaiting verification');
            }}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
          >
            {paymentMethod === 'balance' ? 'Confirm Purchase' : 'I Have Made Payment'}
          </button>
        </div>
      )}
      
      {orderStep === 'waiting' && (
        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-bold text-blue-600 mb-2">Payment Verification</h3>
          <p className="text-sm text-slate-600 mb-4">
            Your payment is being verified. An admin will contact you shortly.
          </p>
          <div className="bg-white p-3 rounded-xl mb-4">
            <p className="font-semibold text-blue-600">Assigned Admin: System Admin</p>
            <p className="text-sm text-slate-600">⭐ 4.5 rating • Avg response: 8 min</p>
          </div>
          <button
            onClick={() => alert('Chat with admin feature - Coming soon!')}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold"
          >
            💬 Chat with Admin
          </button>
        </div>
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
      <div className="flex space-x-2">
        {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center space-y-2 ${
              selectedCrypto === crypto ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            <span className="text-2xl">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
            <span className="font-semibold">{crypto}</span>
          </button>
        ))}
      </div>

      <div className="text-center p-3 bg-slate-100 rounded-xl">
        <p className="text-slate-600">Sell Rate: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{currentRate.toLocaleString()} per {selectedCrypto}</p>
      </div>

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

      <div className="bg-green-50 p-3 rounded-xl border-l-4 border-green-500">
        <p className="text-sm text-slate-600">Available Balance:</p>
        <p className="font-bold text-green-600">{(userBalance[selectedCrypto] || 0).toFixed(8)} {selectedCrypto}</p>
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="text-center p-3 bg-orange-50 rounded-xl">
          <p className="text-orange-600 font-bold">You'll receive: {selectedCurrency === 'NGN' ? '₦' : 'KSh'}{fiatAmount.toLocaleString()}</p>
        </div>
      )}

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

// Deposit Screen Component
const DepositScreenWeb = ({ selectedCurrency, onClose, onSuccess }: any) => {
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const currency = selectedCurrency === 'NG' ? '₦' : 'KSh';
  const currencyName = selectedCurrency === 'NG' ? 'Naira' : 'Shillings';

  const depositMethods = [
    {
      id: 'ng_bank',
      type: 'bank_transfer',
      name: 'Bank Transfer',
      details: 'Transfer to our Nigerian bank account',
      country: 'NG',
      instructions: [
        'Transfer money to the account details below',
        'Use your email as the transfer reference',
        'Upload proof of payment',
        'Funds will be credited within 30 minutes after verification'
      ]
    },
    {
      id: 'ke_bank',
      type: 'bank_transfer', 
      name: 'Bank Transfer',
      details: 'Transfer to our Kenyan bank account',
      country: 'KE',
      instructions: [
        'Transfer money to the account details below',
        'Use your email as the transfer reference', 
        'Upload proof of payment',
        'Funds will be credited within 30 minutes after verification'
      ]
    },
    {
      id: 'ke_mpesa',
      type: 'mobile_money',
      name: 'M-Pesa',
      details: 'Send money via M-Pesa',
      country: 'KE',
      instructions: [
        'Go to M-Pesa menu on your phone',
        'Select Send Money (Lipa na M-Pesa)',
        'Enter the Paybill number below',
        'Use your email as the account number',
        'Upload M-Pesa confirmation message'
      ]
    }
  ];

  const availableMethods = depositMethods.filter(method => method.country === selectedCurrency);

  const bankDetails = {
    NG: {
      accountName: 'BPay Technologies Ltd',
      accountNumber: '0123456789',
      bankName: 'First Bank of Nigeria',
      sortCode: '011151003'
    },
    KE: {
      accountName: 'BPay Kenya Ltd',
      accountNumber: '0987654321',
      bankName: 'Equity Bank Kenya',
      branchCode: '068'
    }
  };

  const mpesaDetails = {
    paybill: '522522',
    businessName: 'BPay Kenya'
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard`);
  };

  const handleSubmitProof = () => {
    if (!amount || !paymentProof) {
      alert('Please fill all fields and upload payment proof');
      return;
    }
    
    alert(`Your deposit of ${currency}${amount} has been submitted for verification. You will be notified once processed.`);
    onSuccess();
  };

  if (!selectedMethod) {
    return (
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <p className="text-center text-slate-600 mb-6">Choose your preferred deposit method:</p>
        
        <div className="space-y-3 mb-6">
          {availableMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method)}
              className="w-full bg-white p-4 rounded-xl flex items-center space-x-4 hover:bg-slate-50 transition-colors shadow-md border border-slate-200"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                method.type === 'bank_transfer' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <span className="text-2xl">
                  {method.type === 'bank_transfer' ? '🏦' : '📱'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-slate-900">{method.name}</h4>
                <p className="text-sm text-slate-600">{method.details}</p>
              </div>
              <span className="text-slate-400 text-xl">›</span>
            </button>
          ))}
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="flex items-center mb-2">
            <span className="text-yellow-600 mr-2">💡</span>
            <h4 className="font-bold text-yellow-800">Important Notes</h4>
          </div>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Minimum deposit: {currency}1,000</p>
            <p>• Processing time: 30 minutes - 2 hours</p>
            <p>• Always use your registered email as reference</p>
            <p>• Keep your payment receipt for verification</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center mb-4">
        <button
          onClick={() => setSelectedMethod(null)}
          className="mr-3 p-2 bg-slate-600 text-white rounded-full hover:bg-slate-700"
        >
          <span className="text-white font-bold">←</span>
        </button>
        <h3 className="text-lg font-bold text-slate-900">{selectedMethod.name}</h3>
      </div>

      {!showUpload ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-3">Instructions</h4>
            <div className="text-sm text-slate-700 space-y-2">
              {selectedMethod.instructions.map((instruction: string, index: number) => (
                <p key={index}>{index + 1}. {instruction}</p>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-3">
              {selectedMethod.type === 'bank_transfer' ? 'Bank Account Details' : 'M-Pesa Details'}
            </h4>
            
            {selectedMethod.type === 'bank_transfer' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Account Name:</span>
                  <button 
                    onClick={() => copyToClipboard(bankDetails[selectedCurrency as 'NG' | 'KE'].accountName, 'Account name')}
                    className="font-bold text-slate-900 hover:text-orange-500"
                  >
                    {bankDetails[selectedCurrency as 'NG' | 'KE'].accountName} 📋
                  </button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Account Number:</span>
                  <button 
                    onClick={() => copyToClipboard(bankDetails[selectedCurrency as 'NG' | 'KE'].accountNumber, 'Account number')}
                    className="font-bold text-slate-900 hover:text-orange-500"
                  >
                    {bankDetails[selectedCurrency as 'NG' | 'KE'].accountNumber} 📋
                  </button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Bank Name:</span>
                  <span className="font-bold text-slate-900">{bankDetails[selectedCurrency as 'NG' | 'KE'].bankName}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-semibold">{selectedCurrency === 'NG' ? 'Sort Code:' : 'Branch Code:'}</span>
                  <span className="font-bold text-slate-900">
                    {selectedCurrency === 'NG' ? bankDetails.NG.sortCode : bankDetails.KE.branchCode}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Paybill Number:</span>
                  <button 
                    onClick={() => copyToClipboard(mpesaDetails.paybill, 'Paybill number')}
                    className="font-bold text-slate-900 hover:text-orange-500"
                  >
                    {mpesaDetails.paybill} 📋
                  </button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Business Name:</span>
                  <span className="font-bold text-slate-900">{mpesaDetails.businessName}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-semibold">Account Number:</span>
                  <span className="font-bold text-slate-900">Your registered email</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            I've Made the Payment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-4">Upload Payment Proof</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Amount Deposited</label>
                <input
                  type="number"
                  placeholder={`Enter amount in ${currencyName}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Payment Reference/Receipt</label>
                <textarea
                  placeholder="Paste transaction reference, receipt number, or M-Pesa confirmation message"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-colors">
                  📷 Take Photo
                </button>
                <button className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-colors">
                  📁 Choose File
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitProof}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            Submit for Verification
          </button>
        </div>
      )}
    </div>
  );
};

// Crypto Wallet Screen Component
const CryptoWalletScreenWeb = ({ onClose, onSuccess }: any) => {
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const wallets = {
    BTC: '',
    ETH: '',
    USDT: ''
  };

  const copyAddress = (address: string, crypto: string) => {
    navigator.clipboard.writeText(address);
    alert(`${crypto} address copied to clipboard`);
  };

  const handleDepositVerification = async () => {
    if (!txHash || !amount) {
      alert('Please enter transaction hash and amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/crypto/verify-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          crypto: selectedCrypto,
          txHash,
          amount: parseFloat(amount)
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.verified) {
          alert(`${amount} ${selectedCrypto} has been added to your wallet`);
          onSuccess();
        } else {
          alert('Transaction not found or already used');
        }
      } else {
        alert('Failed to verify deposit');
      }
    } catch (error) {
      alert('Failed to verify deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      <p className="text-center text-slate-600 mb-6">Select cryptocurrency to deposit:</p>
      
      <div className="space-y-3 mb-6">
        {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`w-full p-5 rounded-xl flex items-center space-x-4 border-2 transition-all shadow-md ${
              selectedCrypto === crypto 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-3xl">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-bold text-slate-900 text-lg">{crypto} Wallet</h4>
              <p className="text-sm text-slate-600">
                {crypto === 'BTC' ? 'Bitcoin Network' : crypto === 'ETH' ? 'Ethereum Network' : 'ERC-20 Network'}
              </p>
            </div>
            {selectedCrypto === crypto && (
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-xl mb-4 shadow-md">
        <h4 className="font-bold text-slate-900 mb-4 text-lg">{selectedCrypto} Deposit Address</h4>
        {wallets[selectedCrypto] ? (
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <p className="font-mono text-sm text-slate-900 mb-3 break-all">{wallets[selectedCrypto]}</p>
            <button 
              onClick={() => copyAddress(wallets[selectedCrypto], selectedCrypto)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              📋 Copy Address
            </button>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div className="w-5 h-8 bg-orange-500 rounded-lg absolute left-3.5 top-2"></div>
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-600 absolute left-3.5 top-0"></div>
              <div className="w-2 h-3 bg-slate-600 rounded absolute left-2 bottom-1"></div>
              <div className="w-2 h-3 bg-slate-600 rounded absolute right-2 bottom-1"></div>
            </div>
            <h5 className="font-bold text-slate-900 mb-2 text-xl">Wallet Integration</h5>
            <p className="text-sm text-slate-600 mb-5 leading-5">
              {selectedCrypto} deposits are being integrated with our secure infrastructure.
            </p>
            <div className="bg-slate-200 h-2 rounded-full mb-2 w-full">
              <div className="bg-orange-500 h-2 rounded-full" style={{width: '92%'}}></div>
            </div>
            <p className="text-xs text-orange-600 font-bold">92% Complete • Expected: 2-3 days</p>
          </div>
        )}
        
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <h5 className="font-bold text-yellow-800 mb-3">⚠️ Important Instructions</h5>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Only send {selectedCrypto} to this address</p>
            <p>• Minimum deposit: {selectedCrypto === 'BTC' ? '0.001 BTC' : selectedCrypto === 'ETH' ? '0.01 ETH' : '10 USDT'}</p>
            <p>• Network: {selectedCrypto === 'USDT' ? 'ERC-20 (Ethereum)' : selectedCrypto === 'BTC' ? 'Bitcoin' : 'Ethereum'}</p>
            <p>• Deposits are automatically verified using blockchain API</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-xl mb-4 shadow-md">
        <h4 className="font-bold text-slate-900 mb-2 text-lg">Verify Your Deposit</h4>
        <p className="text-sm text-slate-600 mb-5">
          After sending crypto, paste your transaction details below for instant verification:
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Transaction Hash (TXID)</label>
            <input
              type="text"
              placeholder="Paste transaction hash here"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Amount Sent</label>
            <input
              type="number"
              placeholder={`Enter ${selectedCrypto} amount`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
            />
          </div>
          
          <button
            onClick={handleDepositVerification}
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-green-600 transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Deposit'}
          </button>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
        <h5 className="font-bold text-green-800 mb-3">💡 How It Works</h5>
        <div className="text-sm text-green-700 space-y-1">
          <p>1. Copy the {selectedCrypto} address above</p>
          <p>2. Send crypto from your external wallet</p>
          <p>3. Copy the transaction hash from your wallet</p>
          <p>4. Paste it here for instant verification</p>
          <p>5. Your balance updates automatically</p>
        </div>
        <p className="text-xs text-green-600 mt-3 italic leading-4">
          🔒 Our system uses blockchain APIs to verify transactions in real-time, preventing fake or duplicate deposits.
        </p>
      </div>
    </div>
  );
};

// Convert Screen Component
const ConvertScreenWeb = ({ balance, usdRates, onClose, onSuccess }: any) => {
  const [fromCrypto, setFromCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [toCrypto, setToCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('ETH');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const getConversionRate = () => {
    const fromRate = usdRates[fromCrypto] || 0;
    const toRate = usdRates[toCrypto] || 0;
    return fromRate / toRate;
  };

  const getConvertedAmount = () => {
    const inputAmount = parseFloat(amount || '0');
    const rate = getConversionRate();
    return inputAmount * rate;
  };

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const inputAmount = parseFloat(amount);
    const availableBalance = balance[fromCrypto] || 0;

    if (inputAmount > availableBalance) {
      alert(`Insufficient balance. You have ${availableBalance.toFixed(8)} ${fromCrypto}`);
      return;
    }

    if (fromCrypto === toCrypto) {
      alert('Cannot convert to the same cryptocurrency');
      return;
    }

    const convertedAmount = getConvertedAmount();
    const rate = getConversionRate();

    if (confirm(`Convert ${amount} ${fromCrypto} to ${convertedAmount.toFixed(8)} ${toCrypto}?\n\nRate: 1 ${fromCrypto} = ${rate.toFixed(8)} ${toCrypto}`)) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/crypto/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fromCrypto,
            toCrypto,
            amount: inputAmount,
            rate: getConversionRate(),
            convertedAmount
          })
        });

        if (response.ok) {
          alert(`Conversion successful! ${amount} ${fromCrypto} converted to ${convertedAmount.toFixed(8)} ${toCrypto}`);
          onSuccess();
        } else {
          alert('Conversion failed. Please try again.');
        }
      } catch (error) {
        alert('Network error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
      <p className="text-center text-slate-600 mb-6">Swap between cryptocurrencies at live market rates</p>
      
      {/* From Section */}
      <div className="mb-4">
        <h4 className="font-bold text-slate-900 mb-3">From</h4>
        <div className="flex space-x-2 mb-3">
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <button
              key={crypto}
              onClick={() => setFromCrypto(crypto)}
              className={`flex-1 p-3 rounded-lg flex flex-col items-center space-y-1 ${
                fromCrypto === crypto ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <span className="text-lg">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
              <span className="text-xs font-semibold">{crypto}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">Available:</span>
          <span className="text-sm font-bold">{(balance[fromCrypto] || 0).toFixed(8)} {fromCrypto}</span>
        </div>
        <input
          type="number"
          placeholder={`Enter ${fromCrypto} amount`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg"
        />
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => {
            const temp = fromCrypto;
            setFromCrypto(toCrypto);
            setToCrypto(temp);
          }}
          className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold"
        >
          ⇅
        </button>
      </div>

      {/* To Section */}
      <div className="mb-4">
        <h4 className="font-bold text-slate-900 mb-3">To</h4>
        <div className="flex space-x-2 mb-3">
          {(['BTC', 'ETH', 'USDT'] as const).map(crypto => (
            <button
              key={crypto}
              onClick={() => setToCrypto(crypto)}
              className={`flex-1 p-3 rounded-lg flex flex-col items-center space-y-1 ${
                toCrypto === crypto ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <span className="text-lg">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
              <span className="text-xs font-semibold">{crypto}</span>
            </button>
          ))}
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-green-600">You will receive:</p>
          <p className="text-lg font-bold text-green-600">{getConvertedAmount().toFixed(8)} {toCrypto}</p>
        </div>
      </div>

      {/* Rate Info */}
      <div className="bg-slate-50 p-4 rounded-lg mb-4 text-center">
        <p className="text-sm text-slate-600 mb-1">Exchange Rate</p>
        <p className="text-lg font-bold text-orange-500">1 {fromCrypto} = {getConversionRate().toFixed(8)} {toCrypto}</p>
        <p className="text-xs text-slate-500">Based on live market prices</p>
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full bg-green-500 text-white py-3 rounded-lg font-bold disabled:opacity-50"
      >
        {loading ? 'Converting...' : `Convert ${fromCrypto} to ${toCrypto}`}
      </button>

      {/* Info */}
      <div className="bg-blue-50 p-3 rounded-lg mt-4 border-l-4 border-blue-500">
        <p className="text-xs text-blue-800 mb-1">🔄 How Conversion Works</p>
        <p className="text-xs text-blue-700">• Conversions use real-time market rates</p>
        <p className="text-xs text-blue-700">• No additional fees - only market spread</p>
        <p className="text-xs text-blue-700">• Instant conversion within your wallet</p>
      </div>
    </div>
  );
};

// Profile Screen Component
const ProfileScreenWeb = ({ fullName, email, user, userAvatar, setUserAvatar, onUpdateProfile, onLogout, onNotification }: any) => {
  const [showKYC, setShowKYC] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState(fullName);
  const [emailPassword, setEmailPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // KYC states
  const [kycStep, setKycStep] = useState(1);
  const [kycData, setKycData] = useState({
    idDocument: '',
    proofOfAddress: '',
    selfieWithId: '',
    fullName: '',
    dateOfBirth: '',
    address: ''
  });

  const kycStatus = user?.kycStatus || 'pending';

  const handleKYC = async () => {
    if (kycStep === 1) {
      setKycStep(2);
    } else if (kycStep === 2) {
      if (!kycData.fullName || !kycData.dateOfBirth || !kycData.address) {
        alert('Please fill all fields');
        return;
      }
      setKycStep(3);
    } else if (kycStep === 3) {
      if (!kycData.idDocument || !kycData.proofOfAddress || !kycData.selfieWithId) {
        alert('Please upload all required documents');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/user/kyc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(kycData)
        });
        
        if (response.ok) {
          alert('KYC documents submitted for review. You will be notified within 24-48 hours.');
          onNotification('KYC documents submitted for review', 'info');
          setShowKYC(false);
          setKycStep(1);
          setKycData({
            idDocument: '',
            proofOfAddress: '',
            selfieWithId: '',
            fullName: '',
            dateOfBirth: '',
            address: ''
          });
        } else {
          alert('Failed to submit KYC. Please try again.');
        }
      } catch (error) {
        alert('Failed to submit KYC. Please try again.');
      }
    }
  };
  
  const handleUpdateProfile = () => {
    if (!newFullName) {
      alert('Please enter your full name');
      return;
    }
    onUpdateProfile(newFullName, email);
    alert('Profile updated successfully!');
  };
  
  const handleUpdateEmail = () => {
    if (!newEmail || !emailPassword || !securityAnswer) {
      alert('Please fill all fields');
      return;
    }
    onUpdateProfile(fullName, newEmail);
    alert('Email updated successfully');
    setShowUpdateEmail(false);
    setNewEmail('');
    setEmailPassword('');
    setSecurityAnswer('');
  };
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword || !securityAnswer) {
      alert('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    alert('Password changed successfully');
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityAnswer('');
  };
  
  const uploadDocument = (docType: string) => {
    // Simulate document upload
    setKycData(prev => ({ ...prev, [docType]: 'uploaded_document.jpg' }));
    alert('Document uploaded successfully!');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              newFullName?.[0] || email?.[0] || 'U'
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const imageUrl = event.target?.result as string;
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${API_BASE}/avatar/upload`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ avatar: imageUrl })
                      });
                      if (response.ok) {
                        setUserAvatar(imageUrl);
                        localStorage.setItem('userAvatar', imageUrl);
                        alert('Avatar updated successfully!');
                      } else {
                        // Fallback to localStorage only
                        setUserAvatar(imageUrl);
                        localStorage.setItem('userAvatar', imageUrl);
                        alert('Avatar updated locally!');
                      }
                    } catch (error) {
                      // Fallback to localStorage only
                      setUserAvatar(imageUrl);
                      localStorage.setItem('userAvatar', imageUrl);
                      alert('Avatar updated locally!');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="avatar-upload"
            />
            <label 
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white hover:bg-orange-600 cursor-pointer"
            >
              ✎
            </label>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Full Name"
              className="text-xl font-bold text-slate-900 bg-transparent border-b border-slate-300 w-full mb-2"
            />
            <div className="flex items-center space-x-2">
              <p className="text-slate-600">{email}</p>
              <button 
                onClick={() => setShowUpdateEmail(true)}
                className="text-orange-500 text-sm"
              >
                ✎
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Country: {user?.kycStatus === 'approved' ? (user?.country === 'NG' ? 'Nigeria' : 'Kenya') : 'Will be set during KYC'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleUpdateProfile}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold mb-4"
        >
          Update Profile
        </button>
        
        <div className="space-y-3">
          <button 
            onClick={() => setShowKYC(true)}
            className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-between px-4"
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">ID</span>
              <div className="text-left">
                <p className="font-bold">KYC Verification</p>
                <p className={`text-sm ${
                  kycStatus === 'verified' ? 'text-green-600' :
                  kycStatus === 'processing' ? 'text-yellow-600' :
                  kycStatus === 'rejected' ? 'text-red-600' :
                  'text-slate-600'
                }`}>
                  {kycStatus === 'pending' && 'Verify your identity'}
                  {kycStatus === 'processing' && 'Under review'}
                  {kycStatus === 'verified' && '✓ Verified'}
                  {kycStatus === 'rejected' && '✗ Rejected - Resubmit'}
                </p>
              </div>
            </div>
            <span className="text-slate-400">›</span>
          </button>
          
          <button 
            onClick={() => setShowChangePassword(true)}
            className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-between px-4"
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm">🔒</span>
              <div className="text-left">
                <p className="font-bold">Change Password</p>
                <p className="text-sm text-slate-600">Update your password</p>
              </div>
            </div>
            <span className="text-slate-400">›</span>
          </button>
          
          <button 
            onClick={() => setShowPaymentMethods(true)}
            className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-between px-4"
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">$</span>
              <div className="text-left">
                <p className="font-bold">Payment Methods</p>
                <p className="text-sm text-slate-600">Manage bank accounts</p>
              </div>
            </div>
            <span className="text-slate-400">›</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold flex items-center justify-between px-4"
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold text-white">X</span>
              <div className="text-left">
                <p className="font-bold">Logout</p>
                <p className="text-sm text-red-200">Sign out of your account</p>
              </div>
            </div>
            <span className="text-red-200">›</span>
          </button>
        </div>
      </div>

      {/* KYC Modal */}
      {showKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">KYC Verification - Step {kycStep}/3</h3>
              <button
                onClick={() => {
                  setShowKYC(false);
                  setKycStep(1);
                }}
                className="p-2 bg-slate-100 rounded-full"
              >
                <span className="text-slate-600 font-bold">✕</span>
              </button>
            </div>
            
            {kycStep === 1 && (
              <div className="space-y-4">
                <p className="text-slate-600">
                  To comply with regulations, we need to verify your identity.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">Required Documents:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>• Any Government ID:</strong></p>
                    <p className="ml-4">- National ID Card</p>
                    <p className="ml-4">- Driver's License</p>
                    <p className="ml-4">- International Passport</p>
                    <p className="ml-4">- Voter's Card</p>
                    <p><strong>• Proof of Address:</strong></p>
                    <p className="ml-4">- Utility Bill (last 3 months)</p>
                    <p className="ml-4">- Bank Statement</p>
                    <p className="ml-4">- Rent Agreement</p>
                    <p><strong>• Selfie with your ID</strong></p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-yellow-800">⚠️ All documents must be clear and readable</p>
                </div>
              </div>
            )}
            
            {kycStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900">Personal Information</h4>
                <p className="text-sm text-slate-600">Enter your details exactly as they appear on your ID:</p>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name as on ID"
                    value={kycData.fullName}
                    onChange={(e) => setKycData(prev => ({...prev, fullName: e.target.value}))}
                    className="w-full p-3 border border-slate-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Date of Birth *</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY (e.g., 15/03/1990)"
                    value={kycData.dateOfBirth}
                    onChange={(e) => setKycData(prev => ({...prev, dateOfBirth: e.target.value}))}
                    className="w-full p-3 border border-slate-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Full Address *</label>
                  <textarea
                    placeholder="Enter your complete address including street, city, state"
                    value={kycData.address}
                    onChange={(e) => setKycData(prev => ({...prev, address: e.target.value}))}
                    rows={3}
                    className="w-full p-3 border border-slate-300 rounded-lg"
                  />
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-green-800">📝 Make sure all information matches your ID document</p>
                </div>
              </div>
            )}
            
            {kycStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900">Document Upload</h4>
                <p className="text-sm text-slate-600">Upload clear photos of your documents:</p>
                
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">1. Government ID Document</h5>
                  <p className="text-xs text-slate-600 mb-2 italic">Take a clear photo of your ID (front and back if applicable)</p>
                  <button
                    onClick={() => uploadDocument('idDocument')}
                    className={`w-full p-3 rounded-lg border-2 border-dashed font-semibold ${
                      kycData.idDocument 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {kycData.idDocument ? '✓ ID Uploaded' : '📷 Upload ID Document'}
                  </button>
                </div>
                
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">2. Proof of Address</h5>
                  <p className="text-xs text-slate-600 mb-2 italic">Upload utility bill, bank statement, or rent agreement</p>
                  <button
                    onClick={() => uploadDocument('proofOfAddress')}
                    className={`w-full p-3 rounded-lg border-2 border-dashed font-semibold ${
                      kycData.proofOfAddress 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {kycData.proofOfAddress ? '✓ Address Proof Uploaded' : '📄 Upload Address Proof'}
                  </button>
                </div>
                
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">3. Selfie with ID</h5>
                  <p className="text-xs text-slate-600 mb-2 italic">Take a selfie holding your ID next to your face</p>
                  <button
                    onClick={() => uploadDocument('selfieWithId')}
                    className={`w-full p-3 rounded-lg border-2 border-dashed font-semibold ${
                      kycData.selfieWithId 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {kycData.selfieWithId ? '✓ Selfie Uploaded' : '🤳 Upload Selfie'}
                  </button>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-800">ℹ️ Ensure all text is readable and photos are well-lit</p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowKYC(false);
                  setKycStep(1);
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleKYC}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
              >
                {kycStep === 1 ? 'Start' : kycStep === 2 ? 'Next' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <span className="text-slate-600 font-bold">✕</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
              
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
              
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Security Question: What is your mother's maiden name?</label>
                <input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Email Modal */}
      {showUpdateEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Email</h3>
              <button
                onClick={() => setShowUpdateEmail(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <span className="text-slate-600 font-bold">✕</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="email"
                placeholder="New Email Address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
              
              <input
                type="password"
                placeholder="Current Password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Security Question: What is your mother's maiden name?</label>
                <input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowUpdateEmail(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmail}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
              <button
                onClick={() => setShowPaymentMethods(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <span className="text-slate-600 font-bold">✕</span>
              </button>
            </div>
            
            <p className="text-slate-600 mb-4">
              Manage your linked bank accounts and payment methods for faster transactions.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => alert('Nigeria Bank Account\n\nGTBank - 0123456789\nBPay Technologies Ltd\n\nUse this for NGN deposits and withdrawals.')}
                className="w-full bg-slate-50 p-4 rounded-lg text-left hover:bg-slate-100"
              >
                <h4 className="font-bold text-slate-900">Nigeria Bank Account</h4>
                <p className="text-sm text-slate-600">Add or update Nigerian bank details</p>
              </button>
              
              <button 
                onClick={() => alert('Kenya M-Pesa\n\nPaybill: 522522\nBusiness: BPay Kenya\nAccount: Your email\n\nUse this for KES deposits and withdrawals.')}
                className="w-full bg-slate-50 p-4 rounded-lg text-left hover:bg-slate-100"
              >
                <h4 className="font-bold text-slate-900">Kenya M-Pesa</h4>
                <p className="text-sm text-slate-600">Add or update M-Pesa details</p>
              </button>
            </div>
            
            <button
              onClick={() => setShowPaymentMethods(false)}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
  const [showConvertScreen, setShowConvertScreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showBuyScreen, setShowBuyScreen] = useState(false);
  const [showSellScreen, setShowSellScreen] = useState(false);
  const [showHistoryScreen, setShowHistoryScreen] = useState(false);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showDepositScreen, setShowDepositScreen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
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

        // Try to get avatar from server, fallback to localStorage
        try {
          const avatarRes = await fetch(`${API_BASE}/avatar`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (avatarRes.ok) {
            const avatarData = await avatarRes.json();
            if (avatarData.avatar) {
              setUserAvatar(avatarData.avatar);
              localStorage.setItem('userAvatar', avatarData.avatar);
            }
          }
        } catch (error) {
          // Fallback to localStorage
          const savedAvatar = localStorage.getItem('userAvatar');
          if (savedAvatar) {
            setUserAvatar(savedAvatar);
          }
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
        // Check for price changes and notify
        Object.entries(newRates).forEach(([crypto, newPrice]) => {
          const oldPrice = usdRates[crypto];
          if (oldPrice && oldPrice > 0) {
            const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
            if (Math.abs(changePercent) >= 5) {
              const direction = changePercent > 0 ? '📈' : '📉';
              const sign = changePercent > 0 ? '+' : '';
              addNotification(
                `${direction} ${crypto} ${sign}${changePercent.toFixed(1)}% - Now $${newPrice.toLocaleString()}`,
                changePercent > 0 ? 'success' : 'warning'
              );
            }
          }
        });
        
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
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedEmail) setEmail(savedEmail);
    if (savedName) setFullName(savedName);
    if (savedAvatar) setUserAvatar(savedAvatar);

    fetchData();
    fetchUsdRates();
    fetchExchangeRates();
    
    // Add welcome notification
    setTimeout(() => {
      addNotification('Welcome to BPay! Start trading crypto with ease.', 'success');
    }, 1000);

    const interval = setInterval(() => {
      fetchUsdRates();
      checkPriceAlerts();
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const addNotification = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const checkPriceAlerts = () => {
    const btcPrice = usdRates.BTC || 0;
    const usdtKesRate = (usdRates.USDT || 1) * exchangeRates.USDKES;
    
    if (btcPrice >= 100000) {
      addNotification(
        `MILESTONE ALERT: Bitcoin hits $${btcPrice.toLocaleString()}! Historic $100K breakthrough!`,
        'success'
      );
    }
    
    if (usdtKesRate >= 129) {
      addNotification(
        `USDT Alert: Rate hits KSh ${usdtKesRate.toFixed(2)} - High end of target range!`,
        'warning'
      );
    } else if (usdtKesRate <= 128) {
      addNotification(
        `USDT Alert: Rate drops to KSh ${usdtKesRate.toFixed(2)} - Low end of target range!`,
        'info'
      );
    }
  };

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

  if (showBuyScreen || showSellScreen || showHistoryScreen || showWalletScreen || showProfileScreen || showDepositScreen) {
    return (
      <div className="min-h-screen bg-slate-800">
        <div className="p-5 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">
              {showBuyScreen ? 'Buy Crypto' : 
               showSellScreen ? 'Sell Crypto' :
               showHistoryScreen ? 'Trade History' :
               showWalletScreen ? 'Crypto Wallet' :
               showDepositScreen ? 'Deposit Funds' : 'Profile'}
            </h1>
            <button
              onClick={() => {
                setShowBuyScreen(false);
                setShowSellScreen(false);
                setShowHistoryScreen(false);
                setShowWalletScreen(false);
                setShowProfileScreen(false);
                setShowDepositScreen(false);
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
            <ProfileScreenWeb 
              fullName={fullName}
              email={email}
              user={user}
              userAvatar={userAvatar}
              setUserAvatar={setUserAvatar}
              onUpdateProfile={(newName: string, newEmail: string) => {
                setFullName(newName);
                setEmail(newEmail);
                localStorage.setItem('userFullName', newName);
                localStorage.setItem('userEmail', newEmail);
              }}
              onLogout={handleLogout}
              onNotification={addNotification}
            />
          )}

          {showWalletScreen && (
            <CryptoWalletScreenWeb 
              onClose={() => {
                setShowWalletScreen(false);
                setActiveTab('home');
              }}
              onSuccess={() => {
                setShowWalletScreen(false);
                setActiveTab('home');
                addNotification('Crypto deposit verified and added to wallet', 'success');
              }}
            />
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

          {showDepositScreen && (
            <DepositScreenWeb 
              selectedCurrency={activeCountry}
              onClose={() => {
                setShowDepositScreen(false);
                setActiveTab('home');
              }}
              onSuccess={() => {
                setShowDepositScreen(false);
                setActiveTab('home');
                addNotification('Fiat deposit submitted - pending verification', 'info');
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      <div className="bg-slate-800 pt-12 pb-5 px-5 rounded-b-3xl shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName?.[0] || email?.[0] || 'U'
              )}
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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Balances</h2>
            
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

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-transparent">
              {selectedAccount === 'crypto' && (
                <>
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">₿</span>
                    <span className="text-slate-600 font-semibold">Crypto Assets</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">₿</span>
                      <span className="text-slate-900 font-semibold">{balance.BTC?.toFixed(6) || '0.000000'} BTC</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">Ξ</span>
                      <span className="text-slate-900 font-semibold">{balance.ETH?.toFixed(4) || '0.0000'} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">₮</span>
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
                    onClick={() => {
                      setShowWalletScreen(true);
                      setActiveTab('wallet');
                    }}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">+</span>
                    <span className="text-xs text-slate-900 font-semibold">Deposit</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowWalletScreen(true);
                      setActiveTab('wallet');
                    }}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">₿</span>
                    <span className="text-xs text-slate-900 font-semibold">Wallet</span>
                  </button>
                  <button 
                    onClick={() => setShowConvertScreen(true)}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">⇄</span>
                    <span className="text-xs text-slate-900 font-semibold">Convert</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setShowBuyScreen(true);
                      setActiveTab('buy');
                    }}
                    className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center min-w-[60px]"
                  >
                    <span className="text-xl text-orange-500 mb-1">↑</span>
                    <span className="text-xs text-slate-900 font-semibold">Buy Crypto</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowDepositScreen(true);
                      setActiveTab('deposit');
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
                    <span className="text-2xl">{crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : '₮'}</span>
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

        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-11/12 max-w-md max-h-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                <button
                  onClick={() => {
                    markNotificationsAsRead();
                    setShowNotifications(false);
                  }}
                  className="p-2 bg-slate-100 rounded-full"
                >
                  <span className="text-slate-600 font-bold">✕</span>
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border-l-4 ${
                          notification.type === 'success' ? 'bg-green-50 border-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-blue-50 border-blue-500'
                        } ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${
                              notification.type === 'success' ? 'text-green-800' :
                              notification.type === 'warning' ? 'text-yellow-800' :
                              'text-blue-800'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{notification.timestamp}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showConvertScreen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-11/12 max-w-md max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-bold text-slate-900">Convert Crypto</h3>
                <button
                  onClick={() => setShowConvertScreen(false)}
                  className="p-2 bg-slate-100 rounded-full"
                >
                  <span className="text-slate-600 font-bold">✕</span>
                </button>
              </div>
              <ConvertScreenWeb 
                balance={balance}
                usdRates={usdRates}
                onClose={() => setShowConvertScreen(false)}
                onSuccess={() => {
                  setShowConvertScreen(false);
                  addNotification('Crypto conversion completed successfully', 'success');
                }}
              />
            </div>
          </div>
        )}

        <div className="h-20"></div>
      </div>
    </div>
  );
}