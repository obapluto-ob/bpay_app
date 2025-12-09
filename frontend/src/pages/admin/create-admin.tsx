import { useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function CreateAdmin() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [superAdminToken, setSuperAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setSuccess(`Admin account created successfully! Email: ${email}`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('admin');
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
    <div className="min-h-screen bg-[#1a365d]">
      <div className="flex flex-col min-h-screen">
        <div className="text-center pt-8 md:pt-16 pb-6 md:pb-8 px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create Admin Account</h1>
          <p className="text-base md:text-lg text-slate-300">Super Admin Only</p>
        </div>

        <div className="flex-1 bg-[#f8fafc] rounded-t-3xl p-4 md:p-6">
          <div className="max-w-md mx-auto w-full">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-6 text-[#1a365d] hover:text-[#f59e0b] flex items-center"
            >
              ← Back to Dashboard
            </button>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              <input
                type="password"
                placeholder="Super Admin Secret Token"
                value={superAdminToken}
                onChange={(e) => setSuperAdminToken(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none"
              />

              <input
                type="text"
                placeholder="Admin Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none"
              />

              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none"
              />

              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none"
              >
                <option value="admin">Admin (Worker)</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f59e0b] text-white p-3 md:p-4 rounded-xl text-base md:text-lg font-bold hover:bg-[#d97706] disabled:opacity-50 transition-colors shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>

            <div className="mt-6 bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
              <p className="text-sm text-yellow-800 font-semibold mb-2">Super Admin Only</p>
              <p className="text-xs text-yellow-700">You need the super admin secret token to create new admin accounts. This token is set in the backend environment variables.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
