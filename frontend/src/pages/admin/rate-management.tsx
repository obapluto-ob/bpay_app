import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function RateManagement() {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<string | null>(null);
  const [formData, setFormData] = useState({ usdPrice: 0, ngnRate: 0, kesRate: 0, buyMargin: 0.02, sellMargin: 0.02 });
  const router = useRouter();

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin-rates/rates`);
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error('Failed to fetch rates');
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin-rates/rates/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Rates synced from CoinGecko successfully');
        fetchRates();
      } else {
        alert('Failed to sync rates');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (crypto: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin-rates/rates/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ crypto, ...formData })
      });
      
      if (response.ok) {
        alert(`${crypto} rate updated successfully`);
        setEditingCrypto(null);
        fetchRates();
      } else {
        alert('Failed to update rate');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (crypto: string) => {
    setEditingCrypto(crypto);
    const rate = rates[crypto];
    setFormData({
      usdPrice: rate.usd,
      ngnRate: rate.ngn,
      kesRate: rate.kes,
      buyMargin: rate.buyMargin,
      sellMargin: rate.sellMargin
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Rate Management</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Syncing...' : 'Sync from CoinGecko'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-slate-500 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(rates).map(([crypto, rate]: [string, any]) => (
            <div key={crypto} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">{crypto}</h3>
                <button
                  onClick={() => startEdit(crypto)}
                  className="text-orange-500 font-semibold"
                >
                  Edit
                </button>
              </div>

              {editingCrypto === crypto ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600">USD Price</label>
                    <input
                      type="number"
                      value={formData.usdPrice}
                      onChange={(e) => setFormData({ ...formData, usdPrice: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">NGN Rate</label>
                    <input
                      type="number"
                      value={formData.ngnRate}
                      onChange={(e) => setFormData({ ...formData, ngnRate: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">KES Rate</label>
                    <input
                      type="number"
                      value={formData.kesRate}
                      onChange={(e) => setFormData({ ...formData, kesRate: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Buy Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.buyMargin * 100}
                      onChange={(e) => setFormData({ ...formData, buyMargin: parseFloat(e.target.value) / 100 })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Sell Margin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sellMargin * 100}
                      onChange={(e) => setFormData({ ...formData, sellMargin: parseFloat(e.target.value) / 100 })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdate(crypto)}
                      className="flex-1 bg-green-500 text-white py-2 rounded font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCrypto(null)}
                      className="flex-1 bg-slate-300 text-slate-700 py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-600">USD:</span> <span className="font-bold">${rate.usd?.toLocaleString()}</span></p>
                  <p><span className="text-slate-600">NGN:</span> <span className="font-bold">₦{rate.ngn?.toLocaleString()}</span></p>
                  <p><span className="text-slate-600">KES:</span> <span className="font-bold">KSh{rate.kes?.toLocaleString()}</span></p>
                  <p><span className="text-slate-600">Buy Margin:</span> <span className="font-bold">{(rate.buyMargin * 100).toFixed(1)}%</span></p>
                  <p><span className="text-slate-600">Sell Margin:</span> <span className="font-bold">{(rate.sellMargin * 100).toFixed(1)}%</span></p>
                  <p className="text-xs text-slate-500">Updated: {new Date(rate.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
