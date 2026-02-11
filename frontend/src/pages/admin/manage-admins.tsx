import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function ManageAdmins() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      if (user.role !== 'super_admin') {
        router.push('/admin/dashboard');
        return;
      }
      setSuperAdminEmail(user.email);
    } else {
      router.push('/admin/login');
      return;
    }

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/adminAuth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          superAdminEmail,
          superAdminPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Admin created successfully!');
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '', role: 'admin' });
        setSuperAdminPassword('');
        fetchAdmins();
      } else {
        setError(data.error || 'Failed to create admin');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Admin deleted successfully');
        fetchAdmins();
      } else {
        alert('Failed to delete admin');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  if (loading && !showCreateForm) {
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
            <button onClick={() => router.push('/admin/dashboard')} className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white">Manage Admins</h1>
              <p className="text-xs md:text-sm text-orange-100">Create and manage admin accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all"
          >
            Create New Admin
          </button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">Admin Accounts ({admins.length})</h2>
          
          {admins.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No admin accounts found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-white border-opacity-10">
                    <th className="text-left p-3 text-slate-300 font-bold">Name</th>
                    <th className="text-left p-3 text-slate-300 font-bold">Email</th>
                    <th className="text-left p-3 text-slate-300 font-bold">Role</th>
                    <th className="text-left p-3 text-slate-300 font-bold">Created</th>
                    <th className="text-left p-3 text-slate-300 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-all">
                      <td className="p-3 text-white font-semibold">{admin.name}</td>
                      <td className="p-3 text-slate-300">{admin.email}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          admin.role === 'super_admin' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {admin.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Admin</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                }}
                className="p-2 bg-slate-100 rounded-full"
              >
                <span className="text-slate-600 font-bold">✕</span>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Admin Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                >
                  <option value="admin">Admin (Trade Support)</option>
                  <option value="super_admin">Super Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Your Password (Verification)</label>
                <input
                  type="password"
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  placeholder="Enter your password to confirm"
                />
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
