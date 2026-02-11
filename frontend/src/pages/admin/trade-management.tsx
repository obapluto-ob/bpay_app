import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function TradeManagement() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTrade) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTrade]);

  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/adminChat/trades/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedTrade) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/adminChat/trades/${selectedTrade.id}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE}/adminChat/trades/${selectedTrade.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const approveTrade = async () => {
    if (!confirm('Approve this trade and credit user?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/adminChat/trades/${selectedTrade.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Trade approved successfully!');
        setSelectedTrade(null);
        fetchTrades();
      }
    } catch (error) {
      alert('Failed to approve trade');
    }
  };

  const rejectTrade = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/adminChat/trades/${selectedTrade.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.ok) {
        alert('Trade rejected');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedTrade(null);
        fetchTrades();
      }
    } catch (error) {
      alert('Failed to reject trade');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-orange-500 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Trade Management</h1>
          <p className="text-xs md:text-sm text-orange-100">Pending: {trades.length}</p>
        </div>
        <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-bold">
          Dashboard
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Trades List */}
        <div className="w-full md:w-1/3 bg-slate-800 overflow-y-auto border-r border-slate-700">
          {trades.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No pending trades</div>
          ) : (
            trades.map((trade) => (
              <button
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                className={`w-full p-4 text-left border-b border-slate-700 hover:bg-slate-700 ${
                  selectedTrade?.id === trade.id ? 'bg-slate-700' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-white">{trade.type.toUpperCase()} {trade.crypto}</p>
                    <p className="text-xs text-slate-400">#{trade.id}</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500 text-xs rounded-full">{trade.status}</span>
                </div>
                <p className="text-sm text-slate-300">{trade.country === 'NG' ? '₦' : 'KSh'}{parseFloat(trade.fiat_amount).toLocaleString()}</p>
                <p className="text-xs text-slate-400">{trade.user_email}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {!selectedTrade ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a trade to view details
            </div>
          ) : (
            <>
              {/* Trade Details - Removed approve/reject buttons from top */}
              <div className="bg-slate-800 p-4 border-b border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <p className="font-bold text-white">{selectedTrade.type.toUpperCase()} {selectedTrade.crypto}</p>
                    <p className="text-sm text-slate-300">
                      {selectedTrade.crypto_amount} {selectedTrade.crypto} = {selectedTrade.country === 'NG' ? '₦' : 'KSh'}{parseFloat(selectedTrade.fiat_amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Payment: {selectedTrade.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_type === 'admin' ? 'bg-orange-500 text-white' : 
                      msg.message_type === 'system' ? 'bg-blue-900 text-blue-100' : 'bg-slate-700 text-white'
                    }`}>
                      {msg.message_type === 'image' ? (
                        <>
                          <img src={msg.message} alt="Proof" className="rounded max-w-full mb-2" />
                          {msg.sender_type === 'user' && (
                            <div className="mt-3 pt-3 border-t border-slate-600 flex gap-2">
                              <button onClick={approveTrade} className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold">
                                Approve
                              </button>
                              <button onClick={() => setShowRejectModal(true)} className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold">
                                Reject
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-slate-800 p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type message..."
                    className="flex-1 p-3 bg-slate-700 text-white rounded-lg"
                  />
                  <button onClick={sendMessage} className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold">
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Trade</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full p-3 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg">
                Cancel
              </button>
              <button onClick={rejectTrade} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
