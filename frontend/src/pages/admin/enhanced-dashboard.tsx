import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const API_URL = 'https://bpay-app.onrender.com/api';

export default function EnhancedAdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState({ totalUsers: 0, todayTrades: 0, todayVolume: 0, pendingTrades: 0, pendingDeposits: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositMethods, setDepositMethods] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    if (!adminData || !token) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(adminData));
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [statsRes, usersRes, tradesRes, depositsRes, methodsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/trades`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/deposits`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/deposit-methods`)
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const tradesData = await tradesRes.json();
      const depositsData = await depositsRes.json();
      const methodsData = await methodsRes.json();

      setStats(statsData);
      setUsers(usersData.users || []);
      setTrades(tradesData.trades || []);
      setDeposits(depositsData.deposits || []);
      setDepositMethods(methodsData);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const approveDeposit = async (id: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API_URL}/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Deposit approved!');
      fetchData(token!);
    } catch (error) {
      alert('Failed to approve deposit');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-xl">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BPay Admin Control Center</h1>
            <p className="text-amber-100">Welcome, {admin?.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <div className="text-blue-100">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.todayTrades}</div>
            <div className="text-green-100">Today's Trades</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">₦{(stats.todayVolume / 1000).toFixed(0)}K</div>
            <div className="text-purple-100">NGN Volume</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">KSh{(stats.todayVolume / 1000).toFixed(0)}K</div>
            <div className="text-indigo-100">KES Volume</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.pendingTrades}</div>
            <div className="text-orange-100">Pending Trades</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.pendingDeposits}</div>
            <div className="text-red-100">Pending Deposits</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {['overview', 'users', 'trades', 'deposits', 'deposit-methods'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-bold ${activeTab === tab ? 'border-b-4 border-amber-500 text-amber-600' : 'text-gray-600'}`}
              >
                {tab.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">KYC</th>
                      <th className="p-3 text-left">Crypto Balances</th>
                      <th className="p-3 text-left">Fiat Balances</th>
                      <th className="p-3 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{user.first_name} {user.last_name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${user.kyc_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {user.kyc_status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          BTC: {user.btc_balance} | ETH: {user.eth_balance} | USDT: {user.usdt_balance}
                        </td>
                        <td className="p-3 text-sm">
                          ₦{parseFloat(user.ngn_balance || 0).toLocaleString()} | KSh{parseFloat(user.kes_balance || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'trades' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Crypto</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{trade.first_name} {trade.last_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${trade.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">{trade.crypto}</td>
                        <td className="p-3">{trade.crypto_amount} {trade.crypto} = {trade.fiat_amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.status === 'completed' ? 'bg-green-100 text-green-800' :
                            trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{new Date(trade.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'deposits' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map(deposit => (
                      <tr key={deposit.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{deposit.first_name} {deposit.last_name}</td>
                        <td className="p-3 font-bold">{deposit.currency} {deposit.amount.toLocaleString()}</td>
                        <td className="p-3">{deposit.payment_method}</td>
                        <td className="p-3 text-sm">{deposit.reference}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            deposit.status === 'completed' ? 'bg-green-100 text-green-800' :
                            deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {deposit.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {deposit.status === 'pending' && (
                            <button
                              onClick={() => approveDeposit(deposit.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'deposit-methods' && depositMethods && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-300">
                  <h3 className="text-xl font-bold text-green-800 mb-4">🇰🇪 Kenya M-Pesa</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600">Paybill Number</div>
                      <div className="text-2xl font-bold text-green-600">{depositMethods.kenya.mpesa.paybill}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600">Account Number</div>
                      <div className="text-2xl font-bold text-green-600">{depositMethods.kenya.mpesa.account}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-300">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">🇳🇬 Nigeria Bank</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600">Bank Name</div>
                      <div className="text-lg font-bold text-blue-600">{depositMethods.nigeria.bank.bankName}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600">Account Name</div>
                      <div className="text-sm font-bold text-blue-600">{depositMethods.nigeria.bank.accountName}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600">Account Number</div>
                      <div className="text-xl font-bold text-blue-600">{depositMethods.nigeria.bank.accountNumber}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-300">
                  <h3 className="text-xl font-bold text-orange-800 mb-4">₿ Crypto Deposits</h3>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600 mb-1">Bitcoin (BTC)</div>
                      <div className="text-xs font-mono text-orange-600 break-all">{depositMethods.crypto.btc.address}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600 mb-1">Ethereum (ERC20)</div>
                      <div className="text-xs font-mono text-orange-600 break-all">{depositMethods.crypto.eth.address}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm text-gray-600 mb-1">USDT - Tron (TRC20)</div>
                      <div className="text-xs font-mono text-orange-600 break-all">{depositMethods.crypto.usdt.address}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-purple-800 mb-4">Recent Users</h3>
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="bg-white p-3 rounded mb-2 flex justify-between">
                      <span>{user.first_name} {user.last_name}</span>
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-amber-800 mb-4">Recent Trades</h3>
                  {trades.slice(0, 5).map(trade => (
                    <div key={trade.id} className="bg-white p-3 rounded mb-2 flex justify-between">
                      <span>{trade.crypto} {trade.type}</span>
                      <span className="text-sm font-bold">{trade.fiat_amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
