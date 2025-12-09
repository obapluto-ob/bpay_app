import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) || 
                       `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.kyc_status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">User Management</h1>
              <p className="text-xs md:text-sm text-orange-100">{users.length} total users</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Dashboard</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl text-white text-sm placeholder-white placeholder-opacity-70 focus:bg-opacity-30 focus:outline-none transition-all"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl text-white text-sm font-bold focus:bg-opacity-30 focus:outline-none transition-all">
            <option value="all" className="bg-slate-800">All Users</option>
            <option value="approved" className="bg-slate-800">KYC Approved</option>
            <option value="pending" className="bg-slate-800">KYC Pending</option>
            <option value="rejected" className="bg-slate-800">KYC Rejected</option>
          </select>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-3 text-slate-300 font-semibold">User</th>
                  <th className="text-left p-3 text-slate-300 font-semibold">Country</th>
                  <th className="text-left p-3 text-slate-300 font-semibold">KYC Status</th>
                  <th className="text-left p-3 text-slate-300 font-semibold">Balances</th>
                  <th className="text-left p-3 text-slate-300 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="p-3">
                      <div className="font-semibold text-white">{user.first_name} {user.last_name}</div>
                      <div className="text-slate-400 text-xs">{user.email}</div>
                      <div className="text-slate-500 text-xs">{user.phone_number || 'No phone'}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-white">{user.country === 'NG' ? '🇳🇬 Nigeria' : '🇰🇪 Kenya'}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.kyc_status === 'approved' ? 'bg-green-600 text-white' :
                        user.kyc_status === 'pending' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {user.kyc_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-white text-xs space-y-1">
                        <div>₿ {parseFloat(user.btc_balance || 0).toFixed(8)}</div>
                        <div>Ξ {parseFloat(user.eth_balance || 0).toFixed(8)}</div>
                        <div>₮ {parseFloat(user.usdt_balance || 0).toFixed(2)}</div>
                        <div className="text-green-400">₦ {parseFloat(user.ngn_balance || 0).toLocaleString()}</div>
                        <div className="text-blue-400">KSh {parseFloat(user.kes_balance || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
