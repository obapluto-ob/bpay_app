import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Home() {
  const [rates, setRates] = useState({ BTC: 0, ETH: 0, USDT: 0 });
  const [exchangeRates, setExchangeRates] = useState({ USDNGN: 1600, USDKES: 150 });
  const router = useRouter();

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
        const data = await response.json();
        setRates({
          BTC: data.bitcoin?.usd || 95000,
          ETH: data.ethereum?.usd || 3400,
          USDT: data.tether?.usd || 1,
        });
      } catch (error) {
        console.log('Failed to fetch rates');
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
        console.log('Failed to fetch exchange rates');
      }
    };
    
    fetchRates();
    fetchExchangeRates();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a365d]">
      {/* Header */}
      <div className="bg-[#1a365d] text-white p-6 pt-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#f59e0b] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">BPay</h1>
              <p className="text-sm text-slate-300">Crypto to Cash Trading</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">🇳🇬 Nigeria • 🇰🇪 Kenya</p>
          </div>
        </div>
      </div>

      <div className="bg-[#f8fafc] min-h-screen -mt-6 rounded-t-3xl p-6">
        {/* Live Rates */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1a365d] mb-4">Live Rates</h2>
          <div className="space-y-3">
            {Object.entries(rates).map(([crypto, price]) => (
              <div key={crypto} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    crypto === 'BTC' ? 'bg-orange-100' : crypto === 'ETH' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <span className={`font-bold ${
                      crypto === 'BTC' ? 'text-orange-600' : crypto === 'ETH' ? 'text-blue-600' : 'text-green-600'
                    }`}>{crypto}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#1a365d]">{crypto}</p>
                    <p className="text-sm text-gray-500">
                      {crypto === 'BTC' ? 'Bitcoin' : crypto === 'ETH' ? 'Ethereum' : 'Tether'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1a365d]">${price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">₦{(price * exchangeRates.USDNGN).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">KSh{(price * exchangeRates.USDKES).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1a365d] mb-4">Get Started</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/auth')}
              className="bg-[#10b981] text-white p-6 rounded-xl text-center hover:bg-[#059669] transition-colors"
            >
              <div className="text-2xl mb-2">📱</div>
              <p className="font-bold">User Login</p>
              <p className="text-sm opacity-90">Trade crypto</p>
            </button>
            <button 
              onClick={() => router.push('/admin/login')}
              className="bg-[#f59e0b] text-white p-6 rounded-xl text-center hover:bg-[#d97706] transition-colors"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <p className="font-bold">Admin Panel</p>
              <p className="text-sm opacity-90">Manage trades</p>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1a365d] mb-4">Features</h2>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">💰</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a365d]">Buy & Sell Crypto</p>
                  <p className="text-sm text-gray-500">Trade Bitcoin, Ethereum, USDT</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">🔒</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a365d]">Secure Escrow</p>
                  <p className="text-sm text-gray-500">Protected transactions</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">💬</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a365d]">Real-time Chat</p>
                  <p className="text-sm text-gray-500">Chat with admins during trades</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>BPay - Secure Crypto Trading Platform</p>
          <p className="mt-2">🇳🇬 Nigeria • 🇰🇪 Kenya</p>
        </div>
      </div>
    </div>
  );
}