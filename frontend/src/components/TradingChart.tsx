import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

interface ChartData {
  time: string;
  price: number;
  volume: number;
}

interface TradingChartProps {
  symbol: string;
  currency: string;
}

export default function TradingChart({ symbol, currency }: TradingChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('24h');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        // Simulate real chart data (replace with actual API)
        const mockData: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          price: 45000 + Math.random() * 5000 - 2500,
          volume: Math.random() * 1000000
        }));
        
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const currentPrice = data[data.length - 1]?.price || 0;
  const previousPrice = data[data.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {symbol}/{currency}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {currency === 'NGN' ? '₦' : 'KSh'}{currentPrice.toLocaleString()}
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              priceChange >= 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex space-x-2">
          {['1h', '24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === tf
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Toggle */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setChartType('area')}
          className={`px-3 py-1 rounded text-sm ${
            chartType === 'area'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Area
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`px-3 py-1 rounded text-sm ${
            chartType === 'line'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Line
        </button>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <YAxis 
                className="text-xs text-gray-500 dark:text-gray-400"
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number) => [`${currency === 'NGN' ? '₦' : 'KSh'}${value.toLocaleString()}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#f97316"
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <YAxis 
                className="text-xs text-gray-500 dark:text-gray-400"
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number) => [`${currency === 'NGN' ? '₦' : 'KSh'}${value.toLocaleString()}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">24h High</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {currency === 'NGN' ? '₦' : 'KSh'}{Math.max(...data.map(d => d.price)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">24h Low</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {currency === 'NGN' ? '₦' : 'KSh'}{Math.min(...data.map(d => d.price)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {(data.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>
    </motion.div>
  );
}