import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin';
  permissions: string[];
  assignedRegion?: 'NG' | 'KE' | 'ALL';
  uniqueLink?: string;
  isActive: boolean;
  lastActive?: string;
}

export default function ManageUsers() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'trade_admin' as 'trade_admin' | 'rate_admin' | 'kyc_admin',
    region: 'NG' as 'NG' | 'KE' | 'ALL'
  });
  const router = useRouter();

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }
    const adminUser = JSON.parse(adminData);
    if (adminUser.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    setAdmin(adminUser);
    loadUsers();
  }, [router]);

  const loadUsers = () => {
    const stored = localStorage.getItem('bpayAdminUsers');
    const adminUsers = stored ? JSON.parse(stored) : [];
    setUsers(adminUsers);
  };

  const generateUniqueLink = (userId: string) => {
    const baseUrl = window.location.origin;
    const uniqueId = `${userId}_${Date.now()}`;
    return `${baseUrl}/admin/access/${uniqueId}`;
  };

  const createUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Please fill all fields');
      return;
    }

    const rolePermissions = {
      trade_admin: ['approve_trades', 'reject_trades', 'view_users'],
      rate_admin: ['manage_rates', 'set_alerts', 'view_analytics'],
      kyc_admin: ['manage_kyc', 'view_users']
    };

    const user: AdminUser = {
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: rolePermissions[newUser.role],
      assignedRegion: newUser.region,
      uniqueLink: generateUniqueLink(`user_${Date.now()}`),
      isActive: true,
      lastActive: new Date().toISOString()
    };

    const existingUsers = users;
    const updatedUsers = [...existingUsers, user];
    localStorage.setItem('bpayAdminUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setNewUser({ name: '', email: '', role: 'trade_admin', region: 'NG' });
    setShowCreateUser(false);
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    );
    localStorage.setItem('bpayAdminUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (!admin) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-800 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-300">Create and manage admin users</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Admin Users ({users.length})</h2>
          <button
            onClick={() => setShowCreateUser(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium"
          >
            Create New User
          </button>
        </div>

        {showCreateUser && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-l-4 border-amber-500">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Admin User</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="trade_admin">Trade Admin</option>
                  <option value="rate_admin">Rate Admin</option>
                  <option value="kyc_admin">KYC Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={newUser.region}
                  onChange={(e) => setNewUser(prev => ({ ...prev, region: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="NG">Nigeria</option>
                  <option value="KE">Kenya</option>
                  <option value="ALL">Global</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={createUser}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium"
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreateUser(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admin users created yet
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {user.assignedRegion === 'NG' ? 'Nigeria' : user.assignedRegion === 'KE' ? 'Kenya' : 'Global'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      user.isActive 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unique Access Link:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user.uniqueLink || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => copyLink(user.uniqueLink || '')}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this link with the user to give them direct access to their admin panel
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}