import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function TradeChatPage() {
  const router = useRouter();
  const { tradeId } = router.query;
  const [trade, setTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!tradeId) return;

    const fetchTrade = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trade/${tradeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrade(data.trade);
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
          setMessages(data);
          
          // Check for approval message
          const lastMsg = data[data.length - 1];
          if (lastMsg?.message?.toLowerCase().includes('credited') || 
              lastMsg?.message?.toLowerCase().includes('approved')) {
            setShowSuccess(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchTrade();
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [tradeId]);

  useEffect(() => {
    if (trade?.status === 'pending' || trade?.status === 'processing') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [trade]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage, type: 'text' })
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkPaid = async () => {
    const paidMessage = `I have completed the payment for Order #${tradeId}. Uploading proof now...`;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: paidMessage, type: 'text' })
      });
      
      setHasPaid(true);
    } catch (error) {
      console.error('Failed to mark paid:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/trade/${tradeId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      alert('Order cancelled successfully');
      router.push('/mobile-exact-dashboard');
    } catch (error) {
      alert('Failed to cancel order');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Payment Confirmed!</h1>
          <p className="text-slate-600 mb-6">Your {trade?.crypto} has been credited to your wallet</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Order ID</p>
            <p className="font-bold text-slate-900">#{tradeId}</p>
          </div>
          <button
            onClick={() => router.push('/mobile-exact-dashboard')}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <button onClick={() => router.push('/mobile-exact-dashboard')} className="text-white text-2xl">←</button>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
            {trade?.adminName?.[0] || 'A'}
          </div>
          <div>
            <p className="text-white font-bold">{trade?.adminName || 'Admin'}</p>
            <p className="text-yellow-400 text-sm">★ {trade?.adminRating?.toFixed(1) || '4.5'}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="bg-orange-500 px-3 py-1 rounded-full">
            <p className="text-white text-xs font-bold">{trade?.status}</p>
          </div>
          {(trade?.status === 'pending' || trade?.status === 'processing') && (
            <div className="bg-red-500 px-3 py-1 rounded-full mt-1">
              <p className="text-white text-xs font-bold">{formatTime(timeRemaining)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.sender_type === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.sender_type === 'system'
                  ? 'bg-yellow-100 text-yellow-900 border-2 border-yellow-500'
                  : 'bg-white text-slate-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white p-4">
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-slate-300 rounded-xl"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
          >
            Send
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!hasPaid && trade?.status === 'pending' && (
            <>
              <button
                onClick={handleMarkPaid}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold"
              >
                I Have Paid
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold"
              >
                Cancel Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Cancel Order</h3>
            <p className="text-slate-600 mb-4">Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full p-3 border border-slate-300 rounded-xl mb-4"
              rows={4}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
