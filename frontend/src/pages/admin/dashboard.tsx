import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'disputes'>('overview');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats({ totalUsers: 0, ngnVolume: 0, kesVolume: 0, pendingTrades: 0, pendingDeposits: 0, recentOrders: [] });
      }

      const adminsRes = await fetch(`${API_BASE}/admin/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData.admins || []);
      }

      const disputesRes = await fetch(`${API_BASE}/admin/disputes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (disputesRes.ok) {
        const disputesData = await disputesRes.json();
        setDisputes(disputesData.disputes || []);
      }

      const ratesRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setRates({
          BTC: ratesData.bitcoin?.usd || 95000,
          ETH: ratesData.ethereum?.usd || 3400,
          USDT: ratesData.tether?.usd || 1
        });
      }

      const tradesRes = await fetch(`${API_BASE}/admin/trades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        const pendingTrades = tradesData.trades?.filter((t: any) => t.status === 'pending') || [];
        setUnreadChats(pendingTrades.length);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-6 shadow-lg border-b-2 border-orange-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 drop-shadow-lg">🔐 SUPER ADMIN PANEL</h1>
            <p className="text-slate-300 font-semibold">Complete system overview and control</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => router.push('/admin/trade-management')} className="bg-slate-700 text-orange-400 px-4 py-2 rounded-lg font-semibold relative hover:bg-slate-600">
              Trade Management
              {stats.pendingTrades > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{stats.pendingTrades}</span>}
            </button>
            <button onClick={() => router.push('/admin/admin-chat')} className="bg-slate-700 text-orange-400 px-4 py-2 rounded-lg font-semibold relative hover:bg-slate-600">
              Admin Chat
              {unreadChats > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{unreadChats}</span>}
            </button>
            <button onClick={() => router.push('/admin/create-admin')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">Create Admin</button>
            <button onClick={() => alert('No new alerts')} className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold relative hover:bg-yellow-700">Alerts</button>
          </div>
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-semibold ${activeTab === 'overview' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Overview</button>
          <button onClick={() => setActiveTab('admins')} className={`px-6 py-2 rounded-lg font-semibold ${activeTab === 'admins' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Admin Performance</button>
          <button onClick={() => setActiveTab('disputes')} className={`px-6 py-2 rounded-lg font-semibold ${activeTab === 'disputes' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Disputes ({disputes.filter(d => d.status === 'open').length})</button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-semibold">Total Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalUsers || 0}</p>
                <p className="text-sm text-slate-400 mt-1">Registered users</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-semibold">NGN Earnings</h3>
                  <span className="text-2xl">🇳🇬</span>
                </div>
                <p className="text-3xl font-bold text-green-400">₦{(stats.ngnVolume || 0).toLocaleString()}</p>
                <p className="text-sm text-slate-400 mt-1">Today's volume</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-semibold">KES Earnings</h3>
                  <span className="text-2xl">🇰🇪</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">KSh{(stats.kesVolume || 0).toLocaleString()}</p>
                <p className="text-sm text-slate-400 mt-1">Today's volume</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-semibold">Pending Trades</h3>
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{stats.pendingTrades || 0}</p>
                <p className="text-sm text-slate-400 mt-1">Requires attention</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 font-semibold">Pending Deposits</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingDeposits || 0}</p>
                <p className="text-sm text-slate-400 mt-1">Awaiting approval</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 shadow-md mb-6 border border-slate-700">
              <h2 className="text-xl font-bold text-orange-500 mb-4">Recent Orders (Click to Follow Up)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-semibold">Order ID</th>
                      <th className="text-left p-3 text-slate-400 font-semibold">User</th>
                      <th className="text-left p-3 text-slate-400 font-semibold">Type</th>
                      <th className="text-left p-3 text-slate-400 font-semibold">Amount</th>
                      <th className="text-left p-3 text-slate-400 font-semibold">Status</th>
                      <th className="text-left p-3 text-slate-400 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentOrders || []).map((order: any) => (
                      <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700 cursor-pointer">
                        <td className="p-3 font-mono text-lg font-bold text-orange-400">#{order.order_id || order.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{order.user_name}</div>
                          <div className="text-xs text-slate-400">{order.user_email}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {order.type.toUpperCase()} {order.crypto}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{order.country === 'NG' ? '₦' : 'KSh'}{order.fiat_amount?.toLocaleString()}</div>
                          <div className="text-xs text-slate-400">{order.crypto_amount} {order.crypto}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => router.push(`/admin/trade-management?tradeId=${order.id}`)} className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-orange-600">View & Chat</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'admins' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
            <h2 className="text-xl font-bold text-orange-500 mb-4">Admin Performance Metrics</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-400 font-semibold">Admin</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Rating</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Total Trades</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Avg Response</th>
                    <th className="text-left p-3 text-slate-400 font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="p-3">
                        <div className="font-semibold text-white">{admin.name}</div>
                        <div className="text-sm text-slate-400">{admin.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold text-white">{admin.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-white">{admin.total_trades || 0}</td>
                      <td className="p-3 text-slate-400">{admin.response_time || 0} min</td>
                      <td className="p-3">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-semibold">{admin.pending_trades || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
            <h2 className="text-xl font-bold text-orange-500 mb-4">Active Disputes</h2>
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No disputes found</div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-slate-700 rounded-lg p-4 bg-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">Trade #{dispute.trade_id}</h3>
                        <p className="text-sm text-slate-400">{dispute.first_name} {dispute.last_name} ({dispute.email})</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${dispute.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{dispute.status}</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg mb-3">
                      <p className="text-sm font-semibold text-slate-300">Reason: {dispute.reason}</p>
                      <p className="text-sm text-slate-400 mt-1">{dispute.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
