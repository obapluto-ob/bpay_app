import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CryptoRate {
  symbol: string;
  name: string;
  price_usd: number;
  percent_change_24h: number;
  ngn_rate: number;
  kes_rate: number;
}

export default function CryptoRates() {
  const [rates, setRates] = useState<CryptoRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Using CoinGecko API (free)
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();
        
        // Convert to NGN and KES (approximate rates)
        const usdToNgn = 1500; // Update with real exchange rate
        const usdToKes = 155;  // Update with real exchange rate
        
        const cryptoRates: CryptoRate[] = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price_usd: data.bitcoin.usd,
            percent_change_24h: data.bitcoin.usd_24h_change,
            ngn_rate: data.bitcoin.usd * usdToNgn,
            kes_rate: data.bitcoin.usd * usdToKes
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price_usd: data.ethereum.usd,
            percent_change_24h: data.ethereum.usd_24h_change,
            ngn_rate: data.ethereum.usd * usdToNgn,
            kes_rate: data.ethereum.usd * usdToKes
          },
          {
            symbol: 'USDT',
            name: 'Tether',
            price_usd: data.tether.usd,
            percent_change_24h: data.tether.usd_24h_change,
            ngn_rate: data.tether.usd * usdToNgn,
            kes_rate: data.tether.usd * usdToKes
          }
        ];
        
        setRates(cryptoRates);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch crypto rates:', error);
        setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Live Crypto Rates
      </h3>
      
      <div className="space-y-3">
        {rates.map((rate) => (
          <motion.div
            key={rate.symbol}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">{rate.symbol}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{rate.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${rate.price_usd.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ₦{rate.ngn_rate.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                KSh{rate.kes_rate.toLocaleString()}
              </p>
              <p className={`text-xs ${rate.percent_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {rate.percent_change_24h >= 0 ? '+' : ''}{rate.percent_change_24h.toFixed(2)}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Updates every 30 seconds • Powered by CoinGecko
      </p>
    </motion.div>
  );
}