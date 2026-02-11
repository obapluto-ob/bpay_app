import { useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/adminAuth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
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
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 md:mb-6 shadow-lg overflow-hidden">
            <img 
              src="/5782897843587714011_120.jpg" 
              alt="BPay Logo" 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">BPay Admin</h1>
          <p className="text-base md:text-lg text-slate-300 mb-2">Administration Portal</p>
          <div className="inline-block bg-red-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
            ADMIN ACCESS ONLY
          </div>
        </div>

        <div className="flex-1 bg-[#f8fafc] rounded-t-3xl p-4 md:p-6">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-xl md:text-2xl font-bold text-[#1a365d] text-center mb-6 md:mb-8">
              Admin Login
            </h2>
            
            {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none transition-colors"
              />
              
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f59e0b] text-white p-3 md:p-4 rounded-xl text-base md:text-lg font-bold mt-6 hover:bg-[#d97706] disabled:opacity-50 transition-colors shadow-lg"
              >
                {loading ? 'Logging in...' : 'Login to Dashboard'}
              </button>
            </form>
            ) : null}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-800 font-semibold mb-2">Admin Access Only</p>
                <p className="text-xs text-yellow-700">This portal is restricted to authorized administrators. User accounts cannot access this area.</p>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
