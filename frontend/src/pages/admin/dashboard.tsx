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

      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch admin performance
      const adminsRes = await fetch(`${API_BASE}/admin/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData.admins || []);
      }

      // Fetch disputes
      const disputesRes = await fetch(`${API_BASE}/admin/disputes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (disputesRes.ok) {
        const disputesData = await disputesRes.json();
        setDisputes(disputesData.disputes || []);
      }

      // Fetch live rates
      const ratesRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setRates({
          BTC: ratesData.bitcoin?.usd || 95000,
          ETH: ratesData.ethereum?.usd || 3400,
          USDT: ratesData.tether?.usd || 1
        });
      }

      // Fetch alerts and unread chats
      const tradesRes = await fetch(`${API_BASE}/admin/trades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        const pendingTrades = tradesData.trades?.filter((t: any) => t.status === 'pending') || [];
        const newAlerts = pendingTrades.map((t: any) => ({
          id: t.id,
          message: `New ${t.type} order: ${t.crypto} - ${t.country === 'NG' ? '₦' : 'KSh'}${t.fiat_amount?.toLocaleString()}`,
          time: new Date(t.created_at).toLocaleTimeString(),
          tradeId: t.id
        }));
        setAlerts(newAlerts);
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-white opacity-90">Complete system overview and control</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/admin/trade-management')}
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold relative"
            >
              Trade Management
              {stats.pendingTrades > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {stats.pendingTrades}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/admin/admin-chat')}
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold relative"
            >
              Admin Chat
              {unreadChats > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {unreadChats}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/admin/create-admin')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Create Admin
            </button>
            <button
              onClick={() => {
                const alertsText = alerts.map(a => `${a.message} (${a.time})`).join('\n');
                alert(alertsText || 'No new alerts');
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold relative"
            >
              Alerts
              {alerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'overview' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'admins' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            Admin Performance
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'disputes' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            Disputes ({disputes.filter(d => d.status === 'open').length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">Total Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.totalUsers || 0}</p>
                <p className="text-sm text-slate-600 mt-1">Registered users</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">NGN Earnings</h3>
                  <span className="text-2xl">🇳🇬</span>
                </div>
                <p className="text-3xl font-bold text-green-600">₦{(stats.ngnVolume || 0).toLocaleString()}</p>
                <p className="text-sm text-slate-600 mt-1">Today's volume</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">KES Earnings</h3>
                  <span className="text-2xl">🇰🇪</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">KSh{(stats.kesVolume || 0).toLocaleString()}</p>
                <p className="text-sm text-slate-600 mt-1">Today's volume</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">Pending Trades</h3>
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-3xl font-bold text-orange-500">{stats.pendingTrades || 0}</p>
                <p className="text-sm text-slate-600 mt-1">Requires attention</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">Pending Deposits</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-yellow-500">{stats.pendingDeposits || 0}</p>
                <p className="text-sm text-slate-600 mt-1">Awaiting approval</p>
              </div>
            </div>

            {/* Recent Orders - Clickable */}
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Orders (Click to Follow Up)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 text-slate-600 font-semibold">Order ID</th>
                      <th className="text-left p-3 text-slate-600 font-semibold">User</th>
                      <th className="text-left p-3 text-slate-600 font-semibold">Type</th>
                      <th className="text-left p-3 text-slate-600 font-semibold">Amount</th>
                      <th className="text-left p-3 text-slate-600 font-semibold">Status</th>
                      <th className="text-left p-3 text-slate-600 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentOrders || []).map((order: any) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-orange-50 cursor-pointer">
                        <td className="p-3 font-mono text-sm">#{order.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{order.user_name}</div>
                          <div className="text-xs text-slate-500">{order.user_email}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.type.toUpperCase()} {order.crypto}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{order.country === 'NG' ? '₦' : 'KSh'}{order.fiat_amount?.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">{order.crypto_amount} {order.crypto}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => router.push(`/admin/trade-management?tradeId=${order.id}`)}
                            className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-orange-600"
                          >
                            View & Chat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Rates */}
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Live Crypto Rates</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Bitcoin</p>
                      <p className="text-2xl font-bold text-orange-600">${rates.BTC?.toLocaleString()}</p>
                    </div>
                    <span className="text-4xl">₿</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Ethereum</p>
                      <p className="text-2xl font-bold text-blue-600">${rates.ETH?.toLocaleString()}</p>
                    </div>
                    <span className="text-4xl">Ξ</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Tether</p>
                      <p className="text-2xl font-bold text-green-600">${rates.USDT?.toFixed(2)}</p>
                    </div>
                    <span className="text-4xl">₮</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/admin/trade-management')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Manage Trades</h3>
                    <p className="text-sm text-slate-600">Verify and approve trades</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/admin-chat')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Admin Chat</h3>
                    <p className="text-sm text-slate-600">Communicate with team</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/enhanced-dashboard')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Analytics</h3>
                    <p className="text-sm text-slate-600">View detailed reports</p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Admin Performance Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Admin Performance Metrics</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 text-slate-600 font-semibold">Admin</th>
                    <th className="text-left p-3 text-slate-600 font-semibold">Rating</th>
                    <th className="text-left p-3 text-slate-600 font-semibold">Total Trades</th>
                    <th className="text-left p-3 text-slate-600 font-semibold">Avg Response</th>
                    <th className="text-left p-3 text-slate-600 font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{admin.name}</div>
                        <div className="text-sm text-slate-500">{admin.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold">{admin.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold">{admin.total_trades || 0}</td>
                      <td className="p-3 text-slate-600">{admin.response_time || 0} min</td>
                      <td className="p-3">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-semibold">
                          {admin.pending_trades || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Active Disputes</h2>
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No disputes found
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">Trade #{dispute.trade_id}</h3>
                        <p className="text-sm text-slate-600">{dispute.first_name} {dispute.last_name} ({dispute.email})</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                        dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-semibold text-slate-700">Reason: {dispute.reason}</p>
                      <p className="text-sm text-slate-600 mt-1">{dispute.evidence}</p>
                    </div>
                    {dispute.status === 'open' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            const response = prompt('Enter resolution response:');
                            if (response) {
                              try {
                                const token = localStorage.getItem('adminToken');
                                await fetch(`${API_BASE}/admin/disputes/${dispute.id}/resolve`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ response, resolution: 'approve' })
                                });
                                alert('Dispute resolved');
                                fetchData();
                              } catch (error) {
                                alert('Failed to resolve dispute');
                              }
                            }
                          }}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold"
                        >
                          Resolve & Approve
                        </button>
                        <button
                          onClick={async () => {
                            const response = prompt('Enter rejection reason:');
                            if (response) {
                              try {
                                const token = localStorage.getItem('adminToken');
                                await fetch(`${API_BASE}/admin/disputes/${dispute.id}/resolve`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ response, resolution: 'reject' })
                                });
                                alert('Dispute resolved');
                                fetchData();
                              } catch (error) {
                                alert('Failed to resolve dispute');
                              }
                            }
                          }}
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold"
                        >
                          Resolve & Reject
                        </button>
                      </div>
                    )}
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
