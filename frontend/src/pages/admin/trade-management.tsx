import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function TradeManagement() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/trades?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTrade = async (trade: any) => {
    setSelectedTrade(trade);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/trade/${trade.id}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTrade) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/trade/${selectedTrade.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage, sender: 'admin' })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const approveTrade = async () => {
    if (!selectedTrade) return;
    
    if (!confirm('Approve this trade? User will receive crypto.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/trades/${selectedTrade.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Trade approved successfully');
        setSelectedTrade(null);
        fetchTrades();
      } else {
        alert('Failed to approve trade');
      }
    } catch (error) {
      alert('Failed to approve trade');
    }
  };

  const rejectTrade = async () => {
    if (!selectedTrade) return;
    
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/trades/${selectedTrade.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Trade rejected');
        setSelectedTrade(null);
        fetchTrades();
      } else {
        alert('Failed to reject trade');
      }
    } catch (error) {
      alert('Failed to reject trade');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Trade Management</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              filter === 'pending' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            Pending ({trades.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              filter === 'all' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              filter === 'completed' ? 'bg-white text-orange-500' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)]">
        {/* Trades List */}
        <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No trades found</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {trades.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => selectTrade(trade)}
                  className={`w-full p-4 text-left hover:bg-slate-50 ${
                    selectedTrade?.id === trade.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">#{trade.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      trade.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{trade.type === 'buy' ? '🟢 BUY' : '🔴 SELL'} {trade.crypto}</p>
                    <p className="font-semibold">{trade.fiatAmount?.toLocaleString()} {trade.country === 'NG' ? 'NGN' : 'KES'}</p>
                    <p className="text-xs mt-1">{new Date(trade.createdAt).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedTrade ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a trade to view details
            </div>
          ) : (
            <>
              {/* Trade Details Header */}
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Order ID</p>
                    <p className="font-bold">#{selectedTrade.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-bold">{selectedTrade.type === 'buy' ? '🟢 BUY' : '🔴 SELL'} {selectedTrade.crypto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-bold">{selectedTrade.fiatAmount?.toLocaleString()} {selectedTrade.country === 'NG' ? 'NGN' : 'KES'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="font-bold capitalize">{selectedTrade.status}</p>
                  </div>
                </div>

                {selectedTrade.paymentProof && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">Payment Proof:</p>
                    <p className="text-sm text-blue-600">{selectedTrade.paymentProof}</p>
                  </div>
                )}

                {selectedTrade.bankDetails && (
                  <div className="bg-green-50 p-3 rounded-lg mt-2">
                    <p className="text-sm font-semibold text-green-800">Bank Details:</p>
                    <p className="text-sm text-green-600">{JSON.stringify(selectedTrade.bankDetails)}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender === 'admin'
                          ? 'bg-orange-500 text-white'
                          : msg.sender === 'system'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-white text-slate-900 shadow-md'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-white opacity-70' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {selectedTrade.status === 'pending' && (
                <div className="bg-white border-t border-slate-200 p-4">
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={approveTrade}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold"
                    >
                      ✓ Approve Trade
                    </button>
                    <button
                      onClick={rejectTrade}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold"
                    >
                      ✗ Reject Trade
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-slate-300 rounded-lg"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
