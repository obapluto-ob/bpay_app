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
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-3 md:p-6 border-b-2 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-orange-500">📊 Analytics & Reports</h1>
            <p className="text-xs md:text-sm text-slate-300">Business insights</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-green-700">📥 Export CSV</button>
            <button onClick={() => router.push('/admin/dashboard')} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-slate-600">← Back</button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Total Volume</h3>
            <p className="text-2xl font-bold text-green-400">₦{totalVolume.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Total Trades</h3>
            <p className="text-2xl font-bold text-blue-400">{trades.length}</p>
            <p className="text-xs text-slate-500 mt-1">{completedTrades} completed</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">Success Rate</h3>
            <p className="text-2xl font-bold text-orange-400">{successRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Completion rate</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-orange-500 mb-4">Trade Distribution</h2>
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

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="text-lg font-bold text-orange-500 mb-4">Recent Activity</h2>
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
