import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function CreateAdmin() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('trade_admin');
  const [superAdminToken, setSuperAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/adminAuth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, superAdminToken })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ Admin created! Email: ${email} | Password: ${password}`);
        setName('');
        setEmail('');
        setPassword('');
        setSuperAdminToken('');
      } else {
        setError(data.error || 'Failed to create admin');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex flex-col min-h-screen">
        <div className="text-center pt-4 md:pt-8 pb-4 md:pb-6 px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-orange-500 mb-2">🔐 Create Admin Account</h1>
          <p className="text-sm md:text-base text-slate-300">Super Admin Only - Secret Token Required</p>
        </div>

        <div className="flex-1 bg-slate-800 rounded-t-3xl p-4 md:p-6">
          <div className="max-w-md mx-auto w-full">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-4 text-orange-500 hover:text-orange-400 flex items-center font-semibold text-sm md:text-base"
            >
              ← Back to Dashboard
            </button>

            <form onSubmit={handleCreate} className="space-y-3 md:space-y-4">
              {error && (
                <div className="bg-red-900 border-l-4 border-red-500 p-3 md:p-4 rounded-xl">
                  <p className="text-red-200 text-xs md:text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900 border-l-4 border-green-500 p-3 md:p-4 rounded-xl">
                  <p className="text-green-200 text-xs md:text-sm font-semibold whitespace-pre-wrap">{success}</p>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 w-full md:w-auto"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}

              <input
                type="password"
                placeholder="🔑 Super Admin Secret Token"
                value={superAdminToken}
                onChange={(e) => setSuperAdminToken(e.target.value)}
                required
                className="w-full p-3 md:p-4 bg-slate-700 border border-slate-600 rounded-xl text-sm md:text-base text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Admin Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 md:p-4 bg-slate-700 border border-slate-600 rounded-xl text-sm md:text-base text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />

              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 md:p-4 bg-slate-700 border border-slate-600 rounded-xl text-sm md:text-base text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />

              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 md:p-4 bg-slate-700 border border-slate-600 rounded-xl text-sm md:text-base text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 md:p-4 bg-slate-700 border border-slate-600 rounded-xl text-sm md:text-base text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="trade_admin">Trade Admin (Verify orders)</option>
                <option value="rate_admin">Rate Admin (Manage rates)</option>
                <option value="kyc_admin">KYC Admin (Verify users)</option>
                <option value="super_admin">Super Admin (Full access)</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white p-3 md:p-4 rounded-xl text-sm md:text-base font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>

            <div className="mt-4 md:mt-6 bg-yellow-900 p-3 md:p-4 rounded-xl border-l-4 border-yellow-500">
              <p className="text-xs md:text-sm text-yellow-200 font-semibold mb-2">🔐 Super Admin Secret Token Required</p>
              <p className="text-xs text-yellow-300">You must enter the correct secret token to create admin accounts. Only super admins have access to this token.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
