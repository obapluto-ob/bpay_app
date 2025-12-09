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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">KYC Verification</h1>
              <p className="text-xs md:text-sm text-orange-100">Review user documents</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Dashboard</button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg">⏳ Pending ({users.filter(u => u.kyc_status === 'pending').length})</button>
            <button className="px-4 py-2.5 bg-white bg-opacity-10 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-opacity-20 transition-all">✅ Approved ({users.filter(u => u.kyc_status === 'approved').length})</button>
            <button className="px-4 py-2.5 bg-white bg-opacity-10 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-opacity-20 transition-all">❌ Rejected ({users.filter(u => u.kyc_status === 'rejected').length})</button>
          </div>

          <div className="space-y-3">
            {users.filter(u => u.kyc_status === 'pending').map((user) => (
              <div key={user.id} className="bg-slate-800 bg-opacity-50 rounded-xl p-4 border border-white border-opacity-10 hover:bg-opacity-70 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm md:text-base">{user.first_name} {user.last_name}</h3>
                    <p className="text-slate-400 text-xs">{user.email}</p>
                    <p className="text-slate-400 text-xs">{user.country === 'NG' ? '🇳🇬 Nigeria' : '🇰🇪 Kenya'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedUser(user)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-blue-600 transition-all">👁️ View</button>
                    <button onClick={() => handleVerify(user.id, 'approved')} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-green-600 transition-all">✅ Approve</button>
                    <button onClick={() => handleVerify(user.id, 'rejected')} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-red-600 transition-all">❌ Reject</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-orange-500 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">📋 KYC Documents - {selectedUser.first_name} {selectedUser.last_name}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Email: {selectedUser.email}</p>
                <p className="text-slate-400 text-sm">Phone: {selectedUser.phone_number || 'N/A'}</p>
                <p className="text-slate-400 text-sm">Country: {selectedUser.country}</p>
              </div>
              <div className="bg-slate-700 bg-opacity-50 p-4 rounded-xl border border-white border-opacity-10">
                <p className="text-white text-sm font-semibold">📄 ID Document: Upload feature coming soon</p>
                <p className="text-white text-sm font-semibold mt-2">📸 Selfie: Upload feature coming soon</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { handleVerify(selectedUser.id, 'approved'); }} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg">✅ Approve</button>
                <button onClick={() => { handleVerify(selectedUser.id, 'rejected'); }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg">❌ Reject</button>
                <button onClick={() => setSelectedUser(null)} className="px-6 bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-600 transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
