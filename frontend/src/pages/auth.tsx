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
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (isSignup) {
        alert('Account created! Please login.');
        setIsSignup(false);
      } else {
        router.push('/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#1a365d]">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center pt-16 pb-8">
          <div className="w-24 h-24 bg-[#f59e0b] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BPay</h1>
          <p className="text-lg text-slate-300 mb-2">Crypto to Cash Trading</p>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <div className="flex items-center gap-1">
              <span>🇳🇬</span>
              <span className="text-sm">Nigeria</span>
            </div>
            <span>|</span>
            <div className="flex items-center gap-1">
              <span>🇰🇪</span>
              <span className="text-sm">Kenya</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 bg-[#f8fafc] rounded-t-3xl p-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] text-center mb-8">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            
            {isSignup && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl mb-4 text-lg"
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl mb-4 text-lg"
            />
            
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl text-lg pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                className="w-full p-4 border border-gray-300 rounded-xl mb-4 text-lg"
              />
            )}
            
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-[#f59e0b] text-white p-4 rounded-xl text-lg font-bold mb-6 hover:bg-[#d97706] disabled:opacity-50"
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
              className="w-full text-[#1a365d] text-center"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}