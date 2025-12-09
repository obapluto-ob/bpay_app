import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function KYCVerification() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const handleVerify = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/kyc/${userId}/${status}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert(`KYC ${status}!`);
        fetchUsers();
        setSelectedUser(null);
      }
    } catch (error) {
      alert('Failed to update KYC');
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-orange-500">📋 KYC Verification</h1>
            <p className="text-xs md:text-sm text-slate-300">Review user documents</p>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:bg-slate-600">← Back</button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-700">
          <div className="flex gap-2 mb-4">
            <button className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs md:text-sm">Pending ({users.filter(u => u.kyc_status === 'pending').length})</button>
            <button className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs md:text-sm">Approved ({users.filter(u => u.kyc_status === 'approved').length})</button>
            <button className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs md:text-sm">Rejected ({users.filter(u => u.kyc_status === 'rejected').length})</button>
          </div>

          <div className="space-y-3">
            {users.filter(u => u.kyc_status === 'pending').map((user) => (
              <div key={user.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm md:text-base">{user.first_name} {user.last_name}</h3>
                    <p className="text-slate-400 text-xs">{user.email}</p>
                    <p className="text-slate-400 text-xs">{user.country === 'NG' ? '🇳🇬 Nigeria' : '🇰🇪 Kenya'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedUser(user)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs md:text-sm hover:bg-blue-700">View Docs</button>
                    <button onClick={() => handleVerify(user.id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-xs md:text-sm hover:bg-green-700">✓ Approve</button>
                    <button onClick={() => handleVerify(user.id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-xs md:text-sm hover:bg-red-700">✗ Reject</button>
                  </div>
                </div>
              </div>
            ))}
            {users.filter(u => u.kyc_status === 'pending').length === 0 && (
              <div className="text-center py-8 text-slate-400">No pending KYC verifications</div>
            )}
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-800 rounded-xl p-4 md:p-6 max-w-2xl w-full border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-orange-500 mb-4">KYC Documents - {selectedUser.first_name} {selectedUser.last_name}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Email: {selectedUser.email}</p>
                <p className="text-slate-400 text-sm">Phone: {selectedUser.phone_number || 'N/A'}</p>
                <p className="text-slate-400 text-sm">Country: {selectedUser.country}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300 text-sm">📄 ID Document: Upload feature coming soon</p>
                <p className="text-slate-300 text-sm mt-2">📸 Selfie: Upload feature coming soon</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { handleVerify(selectedUser.id, 'approved'); }} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">Approve</button>
                <button onClick={() => { handleVerify(selectedUser.id, 'rejected'); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">Reject</button>
                <button onClick={() => setSelectedUser(null)} className="px-4 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
