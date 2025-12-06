import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1a365d] flex items-center justify-center px-5">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 shadow-lg overflow-hidden">
          <img 
            src="/5782897843587714011_120.jpg" 
            alt="BPay Logo" 
            className="w-24 h-24 rounded-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">BPay</h1>
        <p className="text-lg text-slate-300 mb-2">Crypto to Cash Trading</p>
        <p className="text-slate-400 mb-8">🇳🇬 Nigeria • 🇰🇪 Kenya</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f59e0b] mx-auto mb-4"></div>
        <p className="text-slate-300">Loading BPay...</p>
      </div>
    </div>
  );
}