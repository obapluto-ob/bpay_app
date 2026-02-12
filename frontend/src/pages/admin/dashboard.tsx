import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NotificationPanel from '../../components/NotificationPanel';
import { useRealTimeNotifications } from '../../hooks/useRealTimeNotifications';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { showNotification } = useRealTimeNotifications();
  const [stats, setStats] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'disputes'>('overview');
  const [unreadChats, setUnreadChats] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    if (user) setAdminUser(JSON.parse(user));
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) {
        const newStats = await statsRes.json();
        if (newStats.pendingTrades > lastOrderCount && lastOrderCount > 0) {
          showNotification({
            type: 'trade',
            title: 'New Trade Order!',
            message: `${newStats.pendingTrades - lastOrderCount} new trade(s) require attention`
          });
        }
        setLastOrderCount(newStats.pendingTrades);
        setStats(newStats);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="BPay" className="w-10 h-10 md:w-12 md:h-12" />
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white">BPay Admin</h1>
              <p className="text-xs md:text-sm text-orange-100">Super Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <button onClick={handleLogout} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">Logout</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => router.push('/admin/trade-management')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold relative hover:bg-opacity-30 transition-all">
            Trades
            {stats.pendingTrades > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{stats.pendingTrades}</span>}
          </button>
          <button onClick={() => router.push('/admin/users')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-opacity-30 transition-all">Users</button>
          <button onClick={() => router.push('/admin/kyc-verification')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-opacity-30 transition-all">KYC</button>
          <button onClick={() => router.push('/admin/analytics')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-opacity-30 transition-all">Analytics</button>
          <button onClick={() => router.push('/admin/admin-chat')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-opacity-30 transition-all">Chat</button>
          <button onClick={() => router.push('/admin/deposits')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold relative hover:bg-opacity-30 transition-all">
            Deposits
            {stats.pendingDeposits > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{stats.pendingDeposits}</span>}
          </button>
          <button onClick={() => router.push('/admin/withdrawals')} className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-opacity-30 transition-all">Withdrawals</button>
          <button onClick={() => router.push('/admin/system-health')} className="bg-purple-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-purple-600 shadow-lg transition-all">System Health</button>
          {adminUser?.role === 'super_admin' && (
            <>
              <button onClick={() => router.push('/admin/manage-admins')} className="bg-green-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-green-600 shadow-lg transition-all">Manage Admins</button>
              <button onClick={() => router.push('/admin/rate-management')} className="bg-yellow-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-yellow-600 shadow-lg transition-all">Manage Rates</button>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('overview')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'}`}>Overview</button>
          <button onClick={() => setActiveTab('admins')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'admins' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'}`}>Admins</button>
          <button onClick={() => setActiveTab('disputes')} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'disputes' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'}`}>Disputes ({disputes.filter(d => d.status === 'open').length})</button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
              {[
                { label: 'Total Users', value: stats.totalUsers || 0, color: 'from-blue-500 to-blue-600' },
                { label: 'NGN Volume', value: `₦${(stats.ngnVolume || 0).toLocaleString()}`, color: 'from-green-500 to-green-600' },
                { label: 'KES Volume', value: `KSh${(stats.kesVolume || 0).toLocaleString()}`, color: 'from-purple-500 to-purple-600' },
                { label: 'Pending Trades', value: stats.pendingTrades || 0, color: 'from-orange-500 to-orange-600' },
                { label: 'Deposits', value: stats.pendingDeposits || 0, color: 'from-yellow-500 to-yellow-600' }
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 shadow-xl transform hover:scale-105 transition-all`}>
                  <h3 className="text-xs md:text-sm text-white opacity-90 font-semibold mb-2">{stat.label}</h3>
                  <p className="text-xl md:text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-white border-opacity-10">
                      <th className="text-left p-3 text-slate-300 font-bold">Order ID</th>
                      <th className="text-left p-3 text-slate-300 font-bold">User</th>
                      <th className="text-left p-3 text-slate-300 font-bold">Amount</th>
                      <th className="text-left p-3 text-slate-300 font-bold">Status</th>
                      <th className="text-left p-3 text-slate-300 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentOrders || []).map((order: any) => (
                      <tr key={order.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-all">
                        <td className="p-3 font-mono font-bold text-orange-400">#{order.id}</td>
                        <td className="p-3">
                          <div className="text-white font-semibold text-sm">{order.first_name} {order.last_name}</div>
                          <div className="text-xs text-slate-400">{order.email}</div>
                        </td>
                        <td className="p-3 text-white font-bold">{order.country === 'NG' ? '₦' : 'KSh'}{order.fiat_amount?.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>{order.status}</span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => router.push(`/admin/trade-management?tradeId=${order.id}`)} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all">View</button>
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
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">Admin Performance</h2>
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
                      <td className="p-2 text-yellow-400">{admin.average_rating?.toFixed(1) || '0.0'}</td>
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
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">Active Disputes</h2>
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
