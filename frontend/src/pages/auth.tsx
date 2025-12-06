import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (isSignup) {
      if (!fullName || password !== confirmPassword) {
        alert('Please check all fields');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (isSignup) {
        // Register new user
        const response = await fetch('https://bpay-app.onrender.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName })
        });
        
        if (response.ok) {
          alert('Account created successfully! Please login.');
          setIsSignup(false);
          setPassword('');
          setConfirmPassword('');
          setFullName('');
        } else {
          const error = await response.json();
          alert(error.message || 'Registration failed');
        }
      } else {
        // Login existing user (syncs with mobile accounts)
        const response = await fetch('https://bpay-app.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userFullName', data.user?.fullName || email);
          router.push('/dashboard');
        } else {
          const error = await response.json();
          alert(error.message || 'Login failed');
        }
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a365d]">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center pt-8 md:pt-16 pb-6 md:pb-8 px-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 md:mb-6 shadow-lg overflow-hidden">
            <img 
              src="/5782897843587714011_120.jpg" 
              alt="BPay Logo" 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">BPay</h1>
          <p className="text-base md:text-lg text-slate-300 mb-2">Crypto to Cash Trading</p>
          <div className="flex items-center justify-center gap-2 md:gap-3 text-slate-400">
            <div className="flex items-center gap-1">
              <span>🇳🇬</span>
              <span className="text-xs md:text-sm">Nigeria</span>
            </div>
            <span>|</span>
            <div className="flex items-center gap-1">
              <span>🇰🇪</span>
              <span className="text-xs md:text-sm">Kenya</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 bg-[#f8fafc] rounded-t-3xl p-4 md:p-6">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-xl md:text-2xl font-bold text-[#1a365d] text-center mb-6 md:mb-8">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            
            <div className="space-y-4">
              {isSignup && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none transition-colors"
                />
              )}
              
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none transition-colors"
              />
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg pr-12 focus:border-[#f59e0b] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm hover:text-[#f59e0b] transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {isSignup && (
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-xl text-base md:text-lg focus:border-[#f59e0b] focus:outline-none transition-colors"
                />
              )}
            </div>
            
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-[#f59e0b] text-white p-3 md:p-4 rounded-xl text-base md:text-lg font-bold mt-6 mb-4 hover:bg-[#d97706] disabled:opacity-50 transition-colors shadow-lg"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
            
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setEmail('');
                setPassword('');
                setFullName('');
                setConfirmPassword('');
              }}
              className="w-full text-[#1a365d] text-center text-sm md:text-base hover:text-[#f59e0b] transition-colors"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                Same account works on mobile app and web
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>📱 Mobile App</span>
                <span>•</span>
                <span>🌐 Web Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}