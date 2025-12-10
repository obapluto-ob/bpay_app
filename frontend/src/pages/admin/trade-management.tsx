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
      const msgId = 'msg_' + Date.now();
      const newMsg = {
        id: msgId,
        trade_id: selectedTrade.id,
        sender_id: 'admin',
        sender_type: 'admin',
        message: newMessage,
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE}/admin/trades/${selectedTrade.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage, adminId: 'admin_1' })
      });

      if (response.ok) {
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const approveTrade = async () => {
    if (!selectedTrade) return;
    
    if (!confirm(`Approve this trade? User will receive ${selectedTrade.crypto_amount} ${selectedTrade.crypto}`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/trades/${selectedTrade.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Trade approved and crypto credited!');
        setSelectedTrade(null);
        fetchTrades();
      } else {
        alert(data.error || 'Failed to approve trade');
      }
    } catch (error) {
      alert('Failed to approve trade');
    }
  };

  const rejectTrade = async () => {
    if (!selectedTrade) return;
    
    const reason = prompt('Reason for rejection (will be shown to user):');
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

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Trade rejected');
        setSelectedTrade(null);
        fetchTrades();
      } else {
        alert(data.error || 'Failed to reject trade');
      }
    } catch (error) {
      alert('Failed to reject trade');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-orange-600">T</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Trade Management</h1>
              <p className="text-xs md:text-sm text-orange-100">Monitor & verify transactions</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Dashboard</button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all ${
              filter === 'pending' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
Pending ({trades.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all ${
              filter === 'all' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all ${
              filter === 'completed' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
Completed
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)]">
        {/* Trades List */}
        <div className="w-full md:w-1/3 bg-slate-800 bg-opacity-50 backdrop-blur-lg border-r border-white border-opacity-10 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-400">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No trades found</div>
          ) : (
            <div className="divide-y divide-white divide-opacity-5">
              {trades.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => selectTrade(trade)}
                  className={`w-full p-4 text-left hover:bg-white hover:bg-opacity-5 transition-all ${
                    selectedTrade?.id === trade.id ? 'bg-orange-500 bg-opacity-20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-orange-400">#{trade.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      trade.status === 'pending' ? 'bg-yellow-500 text-white' :
                      trade.status === 'completed' ? 'bg-green-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">
                    <p className="font-bold">{trade.type === 'buy' ? 'BUY' : 'SELL'} {trade.crypto}</p>
                    <p className="font-semibold text-white">{trade.fiatAmount?.toLocaleString()} {trade.country === 'NG' ? 'NGN' : 'KES'}</p>
                    <p className="text-xs text-orange-300">{trade.email || `${trade.first_name || ''} ${trade.last_name || ''}`.trim() || 'Unknown User'}</p>
                    <p className="text-xs mt-1 text-slate-400">{new Date(trade.created_at || trade.createdAt || Date.now()).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {!selectedTrade ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-6xl mb-4">💱</div>
                <p className="text-lg">Select a trade to view details</p>
              </div>
            </div>
          ) : (
            <>
              {/* Trade Details Header */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg border-b border-white border-opacity-10 p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Order ID</p>
                    <p className="font-bold text-orange-400">#{selectedTrade.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Type</p>
                    <p className="font-bold text-white">{selectedTrade.type === 'buy' ? 'BUY' : 'SELL'} {selectedTrade.crypto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="font-bold text-white">{selectedTrade.fiatAmount?.toLocaleString()} {selectedTrade.country === 'NG' ? 'NGN' : 'KES'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">User</p>
                    <p className="font-bold text-orange-300">{selectedTrade.email || `${selectedTrade.first_name || ''} ${selectedTrade.last_name || ''}`.trim() || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="font-bold capitalize text-white">{selectedTrade.status}</p>
                  </div>
                </div>

                {selectedTrade.paymentProof && (
                  <div className="bg-blue-500 bg-opacity-20 p-3 rounded-xl border border-blue-500 border-opacity-30">
                    <p className="text-sm font-bold text-blue-300">📎 Payment Proof:</p>
                    <p className="text-sm text-white mt-1">{selectedTrade.paymentProof}</p>
                  </div>
                )}

                {selectedTrade.bankDetails && (
                  <div className="bg-green-500 bg-opacity-20 p-3 rounded-xl mt-2 border border-green-500 border-opacity-30">
                    <p className="text-sm font-bold text-green-300">🏦 Bank Details:</p>
                    <p className="text-sm text-white mt-1">{JSON.stringify(selectedTrade.bankDetails)}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
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
                        {new Date(msg.created_at || msg.timestamp || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {selectedTrade.status === 'pending' && (
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg border-t border-white border-opacity-10 p-4">
                  {selectedTrade.payment_proof && (
                    <div className="bg-purple-500 bg-opacity-20 p-4 rounded-xl mb-3 border border-purple-500 border-opacity-30">
                      <p className="text-purple-300 text-sm font-bold mb-2">📸 Payment Proof:</p>
                      {selectedTrade.payment_proof.startsWith('http') ? (
                        <img src={selectedTrade.payment_proof} alt="Payment proof" className="w-full rounded-lg" />
                      ) : (
                        <p className="text-white text-sm">{selectedTrade.payment_proof}</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={approveTrade}
                      className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg"
                    >
Approve & Credit Crypto
                    </button>
                    <button
                      onClick={rejectTrade}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                    >
Reject Trade
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm('Cancel this trade? This action cannot be undone.')) return;
                      try {
                        const token = localStorage.getItem('adminToken');
                        const response = await fetch(`${API_BASE}/trade/${selectedTrade.id}/cancel`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          }
                        });
                        if (response.ok) {
                          alert('Trade cancelled');
                          setSelectedTrade(null);
                          fetchTrades();
                        }
                      } catch (error) {
                        alert('Failed to cancel trade');
                      }
                    }}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold"
                  >
                    Cancel Trade
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg border-t border-white border-opacity-10 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg"
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
