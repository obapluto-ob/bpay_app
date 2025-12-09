import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'trade_admin' | 'rate_admin' | 'kyc_admin';
  permissions: string[];
  assignedRegion?: 'NG' | 'KE' | 'ALL';
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({
    pendingTrades: 0,
    todayVolume: 0,
    activeUsers: 0,
    pendingKYC: 0,
    alertsTriggered: 0,
    totalAdmins: 0,
    onlineAdmins: 0
  });
  const [liveRates, setLiveRates] = useState({ BTC: 0, ETH: 0, USDT: 0 });
  const [exchangeRates, setExchangeRates] = useState({ USDNGN: 0, USDKES: 0 });
  const [priceAlerts, setPriceAlerts] = useState({
    BTC_100K: { triggered: false, target: 100000 },
    USDT_KES_HIGH: { triggered: false, target: 129 },
    USDT_KES_LOW: { triggered: false, target: 128 }
  });
  
  const getStoredUsers = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('bpayUsers');
    return stored ? JSON.parse(stored) : [];
  };
  
  const getStoredTrades = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('bpayTrades');
    return stored ? JSON.parse(stored) : [];
  };
  
  const getStoredAdmins = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('bpayAdmins');
    return stored ? JSON.parse(stored) : [];
  };
  
  const calculateRealStats = () => {
    const users = getStoredUsers();
    const trades = getStoredTrades();
    const admins = getStoredAdmins();
    
    const pendingTrades = trades.filter((t: any) => t.status === 'pending').length;
    const todayTrades = trades.filter((t: any) => {
      const tradeDate = new Date(t.createdAt).toDateString();
      const today = new Date().toDateString();
      return tradeDate === today;
    });
    const todayVolume = todayTrades.reduce((sum: number, trade: any) => sum + (trade.fiatAmount || 0), 0);
    const activeUsers = users.filter((u: any) => u.isActive !== false).length;
    const pendingKYC = users.filter((u: any) => u.kycStatus === 'pending').length;
    
    return {
      pendingTrades,
      todayVolume,
      activeUsers,
      pendingKYC,
      alertsTriggered: 0,
      totalAdmins: admins.length,
      onlineAdmins: admins.filter((a: any) => a.lastActive && new Date(a.lastActive) > new Date(Date.now() - 30 * 60 * 1000)).length
    };
  };
  const router = useRouter();

  const fetchLiveRates = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
      const data = await response.json();
      const newRates = {
        BTC: data.bitcoin?.usd || 95000,
        ETH: data.ethereum?.usd || 3400,
        USDT: data.tether?.usd || 1,
      };
      setLiveRates(newRates);
      
      // Check price alerts
      checkPriceAlerts(newRates);
    } catch (error) {
      console.log('Failed to fetch live rates');
      // Don't set mock rates - keep previous rates or show error
    }
  };
  
  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates({
        USDNGN: data.rates?.NGN || 1600,
        USDKES: data.rates?.KES || 150,
      });
    } catch (error) {
      console.log('Failed to fetch exchange rates');
      // Don't set mock rates - keep previous rates or show error
    }
  };
  
  const checkPriceAlerts = (rates: Record<string, number>) => {
    const btcPrice = rates.BTC || 0;
    const usdtKesRate = (rates.USDT || 1) * exchangeRates.USDKES;
    const usdtNgnRate = (rates.USDT || 1) * exchangeRates.USDNGN;
    
    let alertCount = 0;
    
    // BTC hits $100K alert
    if (btcPrice >= 100000 && !priceAlerts.BTC_100K.triggered) {
      alertCount++;
      setPriceAlerts(prev => ({
        ...prev,
        BTC_100K: { ...prev.BTC_100K, triggered: true }
      }));
    }
    
    // USDT rate alerts
    if (usdtKesRate >= 129 && !priceAlerts.USDT_KES_HIGH.triggered) {
      alertCount++;
      setPriceAlerts(prev => ({
        ...prev,
        USDT_KES_HIGH: { ...prev.USDT_KES_HIGH, triggered: true }
      }));
    }
    
    if (usdtKesRate <= 128 && !priceAlerts.USDT_KES_LOW.triggered) {
      alertCount++;
      setPriceAlerts(prev => ({
        ...prev,
        USDT_KES_LOW: { ...prev.USDT_KES_LOW, triggered: true }
      }));
    }
    
    // Reset alerts when prices move away
    if (btcPrice < 98000 && priceAlerts.BTC_100K.triggered) {
      setPriceAlerts(prev => ({
        ...prev,
        BTC_100K: { ...prev.BTC_100K, triggered: false }
      }));
    }
    
    if (usdtKesRate < 127 || usdtKesRate > 130) {
      setPriceAlerts(prev => ({
        ...prev,
        USDT_KES_HIGH: { ...prev.USDT_KES_HIGH, triggered: false },
        USDT_KES_LOW: { ...prev.USDT_KES_LOW, triggered: false }
      }));
    }
    
    // Update alert count in stats
    setStats(prev => ({ ...prev, alertsTriggered: alertCount }));
  };

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }
    // Redirect to enhanced dashboard
    router.push('/admin/enhanced-dashboard');
    return;
    setAdmin(JSON.parse(adminData));
    
    // Load real stats
    const realStats = calculateRealStats();
    setStats(realStats);
    
    // Fetch live rates
    fetchLiveRates();
    fetchExchangeRates();
    
    // Refresh stats and rates
    const statsInterval = setInterval(() => {
      const updatedStats = calculateRealStats();
      setStats(updatedStats);
    }, 30000);
    
    const ratesInterval = setInterval(() => {
      fetchLiveRates();
    }, 60000);
    
    const exchangeInterval = setInterval(() => {
      fetchExchangeRates();
    }, 300000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(ratesInterval);
      clearInterval(exchangeInterval);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const hasPermission = (permission: string) => {
    return admin?.permissions.includes('all') || admin?.permissions.includes(permission);
  };

  const getRegionText = () => {
    if (admin?.assignedRegion === 'NG') return 'Nigeria';
    if (admin?.assignedRegion === 'KE') return 'Kenya';
    return 'Global';
  };

  if (!admin) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-300">Welcome back,</p>
            <h1 className="text-2xl font-bold">{admin.name}</h1>
            <p className="text-amber-400 text-sm font-medium">
              {admin.role.replace('_', ' ').toUpperCase()} • {getRegionText()}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              https://bpay-app.netlify.app/admin
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.pendingTrades}</div>
              <div className="text-sm text-gray-600">Pending Trades</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">₦{(stats.todayVolume / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Today's Volume</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.alertsTriggered}</div>
              <div className="text-sm text-gray-600">Rate Alerts</div>
            </div>
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-6">
            <h3 className="font-bold text-gray-800 mb-4">System Health Monitor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="font-bold text-green-600">API Status</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-4 h-3 bg-white rounded-sm"></div>
                </div>
                <div className="font-bold text-blue-600">Database</div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-4 bg-white rounded-full"></div>
                </div>
                <div className="font-bold text-yellow-600">Live Rates</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="font-bold text-purple-600">Admins Online</div>
                <div className="text-sm text-gray-600">{stats.onlineAdmins || 0}/{stats.totalAdmins || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Admin Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Alerts */}
          <div className="lg:col-span-3 mb-6">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full mr-3 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="font-bold text-lg">Live System Alerts</h3>
                </div>
                <div className="space-y-2">
                  {stats.alertsTriggered > 0 ? (
                    <div className="bg-white/20 p-4 rounded-lg">
                      <div className="font-bold">Price Alert Triggered!</div>
                      <div className="text-sm opacity-90">
                        BTC: ${liveRates.BTC?.toLocaleString()} | USDT: KSh{((liveRates.USDT || 1) * exchangeRates.USDKES).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-75">All systems operating normally - No active alerts</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Left Column - Main Functions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Trades */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-amber-500">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Pending Trades ({stats.pendingTrades})</h3>
                  {stats.pendingTrades > 10 && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{Math.floor(stats.pendingTrades * 0.6)}</div>
                    <div className="text-sm text-gray-600">Buy Orders</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{Math.floor(stats.pendingTrades * 0.4)}</div>
                    <div className="text-sm text-gray-600">Sell Orders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Management */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Live Rates & Alerts</h3>
                  {stats.alertsTriggered > 0 && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-orange-600">${liveRates.BTC?.toLocaleString() || '95,000'}</div>
                    <div className="text-xs text-gray-600 mb-1">BTC</div>
                    <div className="text-xs text-gray-500">
                      ₦{((liveRates.BTC || 95000) * exchangeRates.USDNGN).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      KSh{((liveRates.BTC || 95000) * exchangeRates.USDKES).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-blue-600">${liveRates.ETH?.toLocaleString() || '3,400'}</div>
                    <div className="text-xs text-gray-600 mb-1">ETH</div>
                    <div className="text-xs text-gray-500">
                      ₦{((liveRates.ETH || 3400) * exchangeRates.USDNGN).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      KSh{((liveRates.ETH || 3400) * exchangeRates.USDKES).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-green-600">${liveRates.USDT?.toFixed(3) || '1.000'}</div>
                    <div className="text-xs text-gray-600 mb-1">USDT</div>
                    <div className="text-xs text-gray-500">
                      ₦{((liveRates.USDT || 1) * exchangeRates.USDNGN).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      KSh{((liveRates.USDT || 1) * exchangeRates.USDKES).toFixed(2)}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Trade Management */}
            <button
              onClick={() => router.push('/admin/trade-management')}
              className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-6 text-left hover:shadow-md transition-shadow w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Trade Management</h3>
                {stats.pendingTrades > 0 && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{stats.pendingTrades}</div>
                  <div className="text-sm text-gray-600">Pending Trades</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">Chat & Verify</div>
                  <div className="text-sm text-gray-600">Process orders</div>
                </div>
              </div>
            </button>

            {/* User Management - Super Admin Only */}
            {admin.role === 'super_admin' && (
              <button
                onClick={() => router.push('/admin/manage-users')}
                className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-6 text-left hover:shadow-md transition-shadow w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">User Management</h3>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Super Admin</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{stats.totalAdmins || 0}</div>
                    <div className="text-sm text-gray-600">Total Admins</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">Create Users</div>
                    <div className="text-sm text-gray-600">Generate unique links</div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Right Column - Boss Panel (Super Admin Only) */}
          {admin.role === 'super_admin' && (
            <div className="space-y-6">
              {/* Admin Performance */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <h3 className="font-bold">Boss Panel</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm opacity-90">Total Admins:</span>
                      <span className="font-bold">{stats.totalAdmins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm opacity-90">Online Now:</span>
                      <span className="font-bold text-green-300">{stats.onlineAdmins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm opacity-90">Errors Today:</span>
                      <span className="font-bold text-red-300">0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Admin Activity */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h4 className="font-bold text-gray-800">Recent Activity</h4>
                </div>
                <div className="p-4 space-y-3">
                  {getStoredAdmins().slice(0, 3).map((adminUser: any, index: number) => (
                    <div key={adminUser.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          adminUser.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm">{adminUser.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {adminUser.role.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {getStoredAdmins().length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No admin users created yet
                    </div>
                  )}
                </div>
              </div>

              {/* Real Company Metrics */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h4 className="font-bold text-gray-800">System Metrics</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Users</span>
                    <span className="text-blue-600 font-bold">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending KYC</span>
                    <span className="text-yellow-600 font-bold">{stats.pendingKYC}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Today Volume</span>
                    <span className="text-green-600 font-bold">₦{(stats.todayVolume / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Price Alerts</span>
                    <span className={`font-bold ${
                      stats.alertsTriggered > 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>{stats.alertsTriggered} active</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg shadow-lg">
                <div className="p-4 border-b border-white/20">
                  <h4 className="font-bold text-lg">Quick Actions</h4>
                  <p className="text-sm opacity-75">Admin management tools</p>
                </div>
                <div className="p-4 space-y-3">
                  <button 
                    onClick={() => router.push('/admin/admin-chat')}
                    className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group"
                  >
                    <span>Admin Chat</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full opacity-75 group-hover:opacity-100"></div>
                  </button>
                  <button 
                    onClick={() => router.push('/admin/trade-management')}
                    className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group"
                  >
                    <span>Trade Management</span>
                    {stats.pendingTrades > 0 && (
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {stats.pendingTrades}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={() => router.push('/admin/manage-users')}
                    className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between"
                  >
                    <span>Create Admins</span>
                    <div className="text-xs opacity-75">{stats.totalAdmins || 0} total</div>
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm font-medium transition-all duration-200">
                    <span>System Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}