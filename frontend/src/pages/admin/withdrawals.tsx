import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function Withdrawals() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/withdrawals/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    if (!confirm('Approve this withdrawal? Ensure funds have been sent.')) return;

    const notes = prompt('Add processing notes (optional):');
    
    try {
      const token = localStorage.getItem('adminToken');
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      const res = await fetch(`${API_BASE}/withdrawals/admin/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminId: adminUser.id, notes })
      });

      if (res.ok) {
        alert('Withdrawal approved!');
        fetchWithdrawals();
        setSelectedWithdrawal(null);
      }
    } catch (error) {
      alert('Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawalId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('adminToken');
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      const res = await fetch(`${API_BASE}/withdrawals/admin/${withdrawalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminId: adminUser.id, reason })
      });

      if (res.ok) {
        alert('Withdrawal rejected and funds refunded');
        fetchWithdrawals();
        setSelectedWithdrawal(null);
      }
    } catch (error) {
      alert('Failed to reject withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
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
              <span className="text-2xl">💸</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Withdrawal Requests</h1>
              <p className="text-xs md:text-sm text-orange-100">Process user withdrawals</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Dashboard</button>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white border-opacity-10 shadow-2xl">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">Pending Withdrawals ({withdrawals.length})</h2>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-slate-800 bg-opacity-50 rounded-xl p-4 border border-white border-opacity-10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{w.first_name} {w.last_name}</h3>
                      <p className="text-slate-400 text-sm">{w.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400">{w.currency === 'NGN' ? '₦' : w.currency === 'KES' ? 'KSh' : ''}{parseFloat(w.amount).toLocaleString()}</p>
                      <p className="text-slate-400 text-xs">{w.currency}</p>
                    </div>
                  </div>

                  {w.wallet_address && (
                    <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg mb-3 border border-blue-500 border-opacity-30">
                      <p className="text-blue-300 text-sm font-bold">₿ Wallet Address:</p>
                      <p className="text-white text-xs mt-1 break-all">{w.wallet_address}</p>
                    </div>
                  )}

                  {w.bank_details && (
                    <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg mb-3 border border-green-500 border-opacity-30">
                      <p className="text-green-300 text-sm font-bold">🏦 Bank Details:</p>
                      <p className="text-white text-xs mt-1">Bank: {w.bank_details.bankName}</p>
                      <p className="text-white text-xs">Account: {w.bank_details.accountNumber}</p>
                      <p className="text-white text-xs">Name: {w.bank_details.accountName}</p>
                    </div>
                  )}

                  <p className="text-slate-400 text-xs mb-3">Requested: {new Date(w.created_at).toLocaleString()}</p>

                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(w.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition-all">✅ Approve</button>
                    <button onClick={() => handleReject(w.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition-all">❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
