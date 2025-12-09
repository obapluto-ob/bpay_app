import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) setStats(await statsRes.json());
      
      const tradesRes = await fetch(`${API_BASE}/admin/trades`, { headers: { Authorization: `Bearer ${token}` } });
      if (tradesRes.ok) setTrades((await tradesRes.json()).trades || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Order ID', 'User', 'Type', 'Crypto', 'Amount', 'Status', 'Date'].join(','),
      ...trades.map(t => [
        t.order_id || t.id,
        `${t.first_name} ${t.last_name}`,
        t.type,
        t.crypto,
        t.fiat_amount,
        t.status,
        new Date(t.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bpay-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalVolume = (stats.ngnVolume || 0) + (stats.kesVolume || 0);
  const completedTrades = trades.filter(t => t.status === 'completed').length;
  const successRate = trades.length > 0 ? ((completedTrades / trades.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Analytics & Reports</h1>
              <p className="text-xs md:text-sm text-orange-100">Business insights & data</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="bg-green-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-green-600 shadow-lg transition-all">📥 Export</button>
            <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Back</button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
            <h3 className="text-white opacity-90 text-sm font-semibold mb-2">💰 Total Volume</h3>
            <p className="text-3xl font-bold text-white">₦{totalVolume.toLocaleString()}</p>
            <p className="text-xs text-white opacity-75 mt-1">All time</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
            <h3 className="text-white opacity-90 text-sm font-semibold mb-2">📊 Total Trades</h3>
            <p className="text-3xl font-bold text-white">{trades.length}</p>
            <p className="text-xs text-white opacity-75 mt-1">{completedTrades} completed</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
            <h3 className="text-white opacity-90 text-sm font-semibold mb-2">✅ Success Rate</h3>
            <p className="text-3xl font-bold text-white">{successRate}%</p>
            <p className="text-xs text-white opacity-75 mt-1">Completion rate</p>
          </div>
        </div>

        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-10 shadow-2xl mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Trade Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['BTC', 'ETH', 'USDT'].map(crypto => {
              const count = trades.filter(t => t.crypto === crypto).length;
              return (
                <div key={crypto} className="bg-slate-700 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">{crypto}</p>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-500">{trades.length > 0 ? ((count / trades.length) * 100).toFixed(0) : 0}%</p>
                </div>
              );
            })}
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <p className="text-slate-400 text-xs">Pending</p>
              <p className="text-xl font-bold text-yellow-400">{trades.filter(t => t.status === 'pending').length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-10 shadow-2xl">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⏱️</span> Recent Activity
          </h2>
          <div className="space-y-2">
            {trades.slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                <div>
                  <p className="text-white text-sm font-semibold">#{trade.order_id || trade.id}</p>
                  <p className="text-slate-400 text-xs">{trade.first_name} {trade.last_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">{trade.country === 'NG' ? '₦' : 'KSh'}{trade.fiat_amount?.toLocaleString()}</p>
                  <p className="text-slate-400 text-xs">{trade.crypto}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${trade.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>{trade.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
