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
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-3 md:p-6 border-b-2 border-orange-500">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-orange-500">👥 User Management</h1>
            <p className="text-xs md:text-sm text-slate-300">{users.length} total users</p>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-slate-600">← Back</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-500 focus:outline-none">
            <option value="all">All Users</option>
            <option value="approved">KYC Approved</option>
            <option value="pending">KYC Pending</option>
            <option value="rejected">KYC Rejected</option>
          </select>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
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
                        <div>₿ {(user.btc_balance || 0).toFixed(8)}</div>
                        <div>Ξ {(user.eth_balance || 0).toFixed(8)}</div>
                        <div>₮ {(user.usdt_balance || 0).toFixed(2)}</div>
                        <div className="text-green-400">₦ {(user.ngn_balance || 0).toLocaleString()}</div>
                        <div className="text-blue-400">KSh {(user.kes_balance || 0).toLocaleString()}</div>
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
