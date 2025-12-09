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
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold"
            >
              Trade Management
            </button>
            <button
              onClick={() => router.push('/admin/admin-chat')}
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold"
            >
              Admin Chat
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">Total Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.totalUsers || 0}</p>
                <p className="text-sm text-green-600 mt-1">+12% this month</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-600 font-semibold">Today's Trades</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.todayTrades || 0}</p>
                <p className="text-sm text-blue-600 mt-1">₦{(stats.todayVolume || 0).toLocaleString()} volume</p>
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
