import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'disputes'>('overview');
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
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        setStats({ totalUsers: 0, ngnVolume: 0, kesVolume: 0, pendingTrades: 0, pendingDeposits: 0, recentOrders: [] });
      }
      const adminsRes = await fetch(`${API_BASE}/admin/performance`, { headers: { Authorization: `Bearer ${token}` } });
      if (adminsRes.ok) setAdmins((await adminsRes.json()).admins || []);
      const disputesRes = await fetch(`${API_BASE}/admin/disputes`, { headers: { Authorization: `Bearer ${token}` } });
      if (disputesRes.ok) setDisputes((await disputesRes.json()).disputes || []);
      const tradesRes = await fetch(`${API_BASE}/admin/trades`, { headers: { Authorization: `Bearer ${token}` } });
      if (tradesRes.ok) setUnreadChats((await tradesRes.json()).trades?.filter((t: any) => t.status === 'pending').length || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-3 md:p-6 shadow-lg border-b-2 border-orange-500">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-orange-500">🔐 ADMIN PANEL</h1>
            <p className="text-xs md:text-sm text-slate-300">System control</p>
          </div>
          <button onClick={handleLogout} className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-red-700">Logout</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => router.push('/admin/trade-management')} className="bg-slate-700 text-orange-400 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold relative hover:bg-slate-600">
            Trades
            {stats.pendingTrades > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{stats.pendingTrades}</span>}
          </button>
          <button onClick={() => router.push('/admin/admin-chat')} className="bg-slate-700 text-orange-400 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold relative hover:bg-slate-600">
            Chat
            {unreadChats > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadChats}</span>}
          </button>
          <button onClick={() => router.push('/admin/create-admin')} className="bg-green-600 text-white px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-green-700">+ Admin</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('overview')} className={`px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-semibold ${activeTab === 'overview' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Overview</button>
          <button onClick={() => setActiveTab('admins')} className={`px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-semibold ${activeTab === 'admins' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Admins</button>
          <button onClick={() => setActiveTab('disputes')} className={`px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-semibold ${activeTab === 'disputes' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}>Disputes ({disputes.filter(d => d.status === 'open').length})</button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
              {[
                { label: 'Users', value: stats.totalUsers || 0, icon: '👥', color: 'text-white' },
                { label: 'NGN', value: `₦${(stats.ngnVolume || 0).toLocaleString()}`, icon: '🇳🇬', color: 'text-green-400' },
                { label: 'KES', value: `KSh${(stats.kesVolume || 0).toLocaleString()}`, icon: '🇰🇪', color: 'text-blue-400' },
                { label: 'Pending', value: stats.pendingTrades || 0, icon: '⏳', color: 'text-orange-400' },
                { label: 'Deposits', value: stats.pendingDeposits || 0, icon: '💰', color: 'text-yellow-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs md:text-sm text-slate-400">{stat.label}</h3>
                    <span className="text-lg md:text-xl">{stat.icon}</span>
                  </div>
                  <p className={`text-lg md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-700">
              <h2 className="text-base md:text-lg font-bold text-orange-500 mb-3">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400">Order ID</th>
                      <th className="text-left p-2 text-slate-400">User</th>
                      <th className="text-left p-2 text-slate-400">Amount</th>
                      <th className="text-left p-2 text-slate-400">Status</th>
                      <th className="text-left p-2 text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentOrders || []).map((order: any) => (
                      <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-2 font-mono font-bold text-orange-400">#{order.order_id || order.id}</td>
                        <td className="p-2">
                          <div className="text-white text-xs md:text-sm">{order.user_name}</div>
                          <div className="text-xs text-slate-500">{order.user_email}</div>
                        </td>
                        <td className="p-2 text-white">{order.country === 'NG' ? '₦' : 'KSh'}{order.fiat_amount?.toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>{order.status}</span>
                        </td>
                        <td className="p-2">
                          <button onClick={() => router.push(`/admin/trade-management?tradeId=${order.id}`)} className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600">View</button>
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
          <div className="bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-700">
            <h2 className="text-base md:text-lg font-bold text-orange-500 mb-3">Admin Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 text-slate-400">Admin</th>
                    <th className="text-left p-2 text-slate-400">Rating</th>
                    <th className="text-left p-2 text-slate-400">Trades</th>
                    <th className="text-left p-2 text-slate-400">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-slate-700">
                      <td className="p-2 text-white">{admin.name}</td>
                      <td className="p-2 text-yellow-400">⭐ {admin.average_rating?.toFixed(1) || '0.0'}</td>
                      <td className="p-2 text-white">{admin.total_trades || 0}</td>
                      <td className="p-2"><span className="bg-orange-600 text-white px-2 py-1 rounded text-xs">{admin.pending_trades || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-700">
            <h2 className="text-base md:text-lg font-bold text-orange-500 mb-3">Active Disputes</h2>
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No disputes</div>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-slate-700 rounded-lg p-3 bg-slate-700">
                    <h3 className="font-bold text-white text-sm">Trade #{dispute.trade_id}</h3>
                    <p className="text-xs text-slate-400">{dispute.first_name} {dispute.last_name}</p>
                    <p className="text-xs text-slate-300 mt-2">{dispute.reason}</p>
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
