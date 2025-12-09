import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function SystemHealth() {
  const router = useRouter();
  const [health, setHealth] = useState<any>(null);
  const [profit, setProfit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const [healthRes, profitRes] = await Promise.all([
        fetch(`${API_BASE}/system/health`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/system/profit-loss`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (profitRes.ok) {
        const profitData = await profitRes.json();
        setProfit(profitData);
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Scanning system...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Health Monitor</h1>
              <p className="text-sm text-orange-100">Real-time system diagnostics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold hover:bg-orange-50 shadow-lg transition-all disabled:opacity-50"
            >
              {refreshing ? '⟳ Refreshing...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-30 shadow-lg transition-all"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* System Status */}
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">System Status</h2>
            <div className={`px-4 py-2 rounded-full ${getStatusColor(health?.status)} text-white font-bold`}>
              {health?.status?.toUpperCase()}
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">Last checked: {new Date(health?.timestamp).toLocaleString()}</p>
        </div>

        {/* Critical Issues */}
        {health?.issues?.length > 0 && (
          <div className="bg-red-500 bg-opacity-10 backdrop-blur-lg rounded-2xl border-2 border-red-500 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Critical Issues ({health.issues.length})</h2>
            <div className="space-y-3">
              {health.issues.map((issue: any, i: number) => (
                <div key={i} className="bg-red-900 bg-opacity-30 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-red-300">{issue.type.replace(/_/g, ' ').toUpperCase()}</h3>
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">{issue.severity}</span>
                  </div>
                  <p className="text-red-200 text-sm mb-2">{issue.message}</p>
                  <p className="text-red-300 text-xs font-bold">Action: {issue.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {health?.warnings?.length > 0 && (
          <div className="bg-yellow-500 bg-opacity-10 backdrop-blur-lg rounded-2xl border border-yellow-500 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Warnings ({health.warnings.length})</h2>
            <div className="space-y-3">
              {health.warnings.map((warning: any, i: number) => (
                <div key={i} className="bg-yellow-900 bg-opacity-20 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-yellow-300">{warning.type.replace(/_/g, ' ').toUpperCase()}</h3>
                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">{warning.severity}</span>
                  </div>
                  <p className="text-yellow-200 text-sm">{warning.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit & Loss */}
        {profit && (
          <div className="bg-green-500 bg-opacity-10 backdrop-blur-lg rounded-2xl border border-green-500 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">💰 Profit & Loss</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-900 bg-opacity-20 p-4 rounded-xl">
                <p className="text-green-300 text-sm mb-1">Total Trades</p>
                <p className="text-2xl font-bold text-white">{profit.summary.total_trades}</p>
              </div>
              <div className="bg-green-900 bg-opacity-20 p-4 rounded-xl">
                <p className="text-green-300 text-sm mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-white">₦{parseFloat(profit.summary.total_volume || 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-900 bg-opacity-20 p-4 rounded-xl">
                <p className="text-green-300 text-sm mb-1">Gross Profit (2%)</p>
                <p className="text-2xl font-bold text-green-400">₦{parseFloat(profit.summary.total_gross_profit || 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-900 bg-opacity-20 p-4 rounded-xl">
                <p className="text-green-300 text-sm mb-1">Net Profit (70%)</p>
                <p className="text-2xl font-bold text-green-400">₦{parseFloat(profit.summary.total_net_profit || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 bg-green-900 bg-opacity-20 p-4 rounded-xl">
              <p className="text-green-300 text-sm mb-2">Fee Structure:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div><span className="text-slate-400">Buy Markup:</span> <span className="text-white font-bold">+2%</span></div>
                <div><span className="text-slate-400">Sell Markdown:</span> <span className="text-white font-bold">-2%</span></div>
                <div><span className="text-slate-400">Net Margin:</span> <span className="text-white font-bold">70%</span></div>
                <div><span className="text-slate-400">Operating Costs:</span> <span className="text-white font-bold">30%</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">User Balances</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Total Users:</span> <span className="text-white font-bold">{health?.metrics?.userBalances?.total_users}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">BTC:</span> <span className="text-white font-bold">{parseFloat(health?.metrics?.userBalances?.total_btc || 0).toFixed(8)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">ETH:</span> <span className="text-white font-bold">{parseFloat(health?.metrics?.userBalances?.total_eth || 0).toFixed(8)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">USDT:</span> <span className="text-white font-bold">{parseFloat(health?.metrics?.userBalances?.total_usdt || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pending Trades</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Count:</span> <span className="text-white font-bold">{health?.metrics?.pendingTrades?.count}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Fiat:</span> <span className="text-white font-bold">₦{parseFloat(health?.metrics?.pendingTrades?.total_fiat || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Admin Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Total Admins:</span> <span className="text-white font-bold">{health?.metrics?.admins?.total_admins}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Online:</span> <span className="text-green-400 font-bold">{health?.metrics?.admins?.online_admins}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Avg Rating:</span> <span className="text-white font-bold">{parseFloat(health?.metrics?.admins?.avg_rating || 0).toFixed(2)} ⭐</span></div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {health?.recommendations?.length > 0 && (
          <div className="bg-blue-500 bg-opacity-10 backdrop-blur-lg rounded-2xl border border-blue-500 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">💡 Recommendations</h2>
            <ul className="space-y-2">
              {health.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-blue-200 text-sm flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
