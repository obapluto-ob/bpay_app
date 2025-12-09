import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function AdminDeposits() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchDeposits();
    const interval = setInterval(fetchDeposits, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/deposits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (depositId: string, amount: number, currency: string, userId: string) => {
    if (!confirm(`Approve deposit of ${amount} ${currency}?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, amount, currency })
      });
      
      if (res.ok) {
        alert('Deposit approved and balance credited!');
        fetchDeposits();
      } else {
        alert('Failed to approve deposit');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleReject = async (depositId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        alert('Deposit rejected');
        fetchDeposits();
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const filtered = deposits.filter(d => filter === 'all' || d.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Deposit Management</h1>
              <p className="text-sm text-orange-100">{deposits.length} total deposits</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold hover:bg-orange-50 shadow-lg">← Back</button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl font-bold ${filter === 'pending' ? 'bg-white text-orange-600' : 'bg-white bg-opacity-20 text-white'}`}>
            Pending ({deposits.filter(d => d.status === 'pending').length})
          </button>
          <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-xl font-bold ${filter === 'approved' ? 'bg-white text-orange-600' : 'bg-white bg-opacity-20 text-white'}`}>
            Approved ({deposits.filter(d => d.status === 'approved').length})
          </button>
          <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-xl font-bold ${filter === 'rejected' ? 'bg-white text-orange-600' : 'bg-white bg-opacity-20 text-white'}`}>
            Rejected ({deposits.filter(d => d.status === 'rejected').length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 p-12 text-center">
            <p className="text-slate-400">No {filter} deposits</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((deposit) => (
              <div key={deposit.id} className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl border border-white border-opacity-10 shadow-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Deposit #{deposit.id}</h3>
                    <p className="text-slate-400 text-sm">{deposit.user_email || 'User ID: ' + deposit.user_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    deposit.status === 'approved' ? 'bg-green-500 text-white' :
                    deposit.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {deposit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Amount</p>
                    <p className="text-white font-bold">{deposit.currency} {parseFloat(deposit.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Method</p>
                    <p className="text-white font-bold">{deposit.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Reference</p>
                    <p className="text-white font-bold text-xs">{deposit.reference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Date</p>
                    <p className="text-white font-bold text-xs">{new Date(deposit.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {deposit.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(deposit.id, deposit.amount, deposit.currency, deposit.user_id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600"
                    >
                      ✓ Approve & Credit
                    </button>
                    <button
                      onClick={() => handleReject(deposit.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold hover:bg-red-600"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
