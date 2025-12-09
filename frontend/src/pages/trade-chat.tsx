import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function TradeChat() {
  const router = useRouter();
  const { tradeId } = router.query;
  const [trade, setTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tradeId) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchTradeDetails();
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [tradeId]);

  const fetchTradeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrade(data);
      }
    } catch (error) {
      console.error('Failed to fetch trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
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
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/mobile-exact-dashboard')}
          className="text-white"
        >
          ← Back
        </button>
        <div className="text-center flex-1">
          <h1 className="text-white font-bold">
            {trade?.type?.toUpperCase()} {trade?.crypto}
          </h1>
          <p className="text-slate-400 text-sm">
            {trade?.status === 'pending' ? '⏳ Pending' : 
             trade?.status === 'completed' ? '✅ Completed' : 
             trade?.status === 'cancelled' ? '❌ Cancelled' : trade?.status}
          </p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Trade Details */}
      <div className="bg-white p-4 border-b">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Amount</p>
            <p className="font-bold">{trade?.fiatAmount} {trade?.country === 'NG' ? 'NGN' : 'KES'}</p>
          </div>
          <div>
            <p className="text-slate-600">Crypto</p>
            <p className="font-bold">{parseFloat(trade?.cryptoAmount || 0).toFixed(6)} {trade?.crypto}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender === 'system'
                  ? 'bg-yellow-100 text-yellow-900 text-center w-full'
                  : msg.sender === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-900'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {trade?.status === 'pending' && (
        <div className="bg-slate-100 p-3 border-t space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (!confirm('Mark this order as completed?')) return;
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`${API_BASE}/trade/${tradeId}/complete`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (response.ok) {
                    alert('Order marked as completed!');
                    fetchTradeDetails();
                  }
                } catch (error) {
                  alert('Failed to complete order');
                }
              }}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm"
            >
              ✓ Complete Order
            </button>
            <button
              onClick={async () => {
                const reason = prompt('Dispute reason:');
                const evidence = prompt('Evidence/Details:');
                if (!reason || !evidence) return;
                
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`${API_BASE}/trade/${tradeId}/dispute`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason, evidence })
                  });
                  if (response.ok) {
                    alert('Dispute raised! Admin will review.');
                    fetchTradeDetails();
                    fetchMessages();
                  }
                } catch (error) {
                  alert('Failed to raise dispute');
                }
              }}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm"
            >
              ⚠ Raise Dispute
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-slate-300 rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
