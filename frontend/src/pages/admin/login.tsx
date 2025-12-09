import { useState } from 'react';
import { useRouter } from 'next/router';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin';
  permissions: string[];
  assignedRegion?: 'NG' | 'KE' | 'ALL';
  password: string;
  createdAt: string;
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin'>('trade_admin');
  const [selectedRegion, setSelectedRegion] = useState<'NG' | 'KE' | 'ALL'>('NG');
  const router = useRouter();

  const getStoredAdmins = (): AdminUser[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('bpayAdmins');
    return stored ? JSON.parse(stored) : [];
  };

  const saveAdmin = (admin: AdminUser) => {
    const admins = getStoredAdmins();
    admins.push(admin);
    localStorage.setItem('bpayAdmins', JSON.stringify(admins));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignup) {
        // Create new admin
        if (!fullName || !email || !password || !confirmPassword) {
          alert('Please fill all fields');
          setLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          alert('Passwords do not match');
          setLoading(false);
          return;
        }
        
        const admins = getStoredAdmins();
        if (admins.find(a => a.email === email)) {
          alert('Admin with this email already exists');
          setLoading(false);
          return;
        }
        
        const rolePermissions = {
          super_admin: ['all'],
          trade_admin: ['approve_trades', 'reject_trades', 'view_users'],
          rate_admin: ['manage_rates', 'set_alerts', 'view_analytics'],
          kyc_admin: ['manage_kyc', 'view_users']
        };
        
        const newAdmin: AdminUser = {
          id: `admin_${Date.now()}`,
          name: fullName,
          email,
          role: 'super_admin',
          permissions: ['all'],
          assignedRegion: 'ALL',
          password,
          createdAt: new Date().toISOString()
        };
        
        saveAdmin(newAdmin);
        alert('Admin account created successfully! Please login.');
        setIsSignup(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login
        const admins = getStoredAdmins();
        const admin = admins.find(a => a.email === email && a.password === password);
        
        if (admin) {
          localStorage.setItem('adminUser', JSON.stringify(admin));
          router.push('/admin/dashboard');
        } else {
          alert('Invalid credentials');
        }
      }
    } catch (error) {
      alert('Authentication failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="/5782897843587714011_120.jpg" 
              alt="BPay Logo" 
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BPay Admin Panel</h1>
          <p className="text-slate-400">Secure Admin Access</p>
          <div className="mt-4 bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Admin Panel URL:</p>
            <p className="text-sm text-amber-400 font-mono break-all">
              https://bpay-app.netlify.app/admin
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {isSignup ? 'Create Admin Account' : 'Sign In'}
            </h2>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                

                

              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Admin Account' : 'Admin Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFullName('');
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              {isSignup ? 'Already have admin account? Login' : 'Create new admin account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}