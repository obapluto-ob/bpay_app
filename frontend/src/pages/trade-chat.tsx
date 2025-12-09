import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function TradeChatScreen() {
  const router = useRouter();
  const { tradeId } = router.query;
  
  const [trade, setTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (!tradeId) return;

    const fetchTradeData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch trade details
        const tradeRes = await fetch(`${API_BASE}/trade/${tradeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tradeRes.ok) {
          const tradeData = await tradeRes.json();
          setTrade(tradeData);
        }

        // Fetch chat messages
        const messagesRes = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch trade data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeData();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchTradeData, 5000);
    
    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [tradeId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
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
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const uploadPaymentProof = async () => {
    const proof = prompt('Paste transaction reference or upload link:');
    if (!proof) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/payment-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentProof: proof })
      });

      if (response.ok) {
        alert('Payment proof uploaded successfully');
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'system',
          message: '📎 Payment proof uploaded',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      alert('Failed to upload payment proof');
    }
  };

  const raiseDispute = async () => {
    if (!disputeReason || !disputeEvidence) {
      alert('Please provide reason and evidence');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: disputeReason, evidence: disputeEvidence })
      });

      if (response.ok) {
        alert('Dispute raised successfully. Admin will review within 24 hours.');
        setShowDisputeModal(false);
        setDisputeReason('');
        setDisputeEvidence('');
      }
    } catch (error) {
      alert('Failed to raise dispute');
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment: ratingComment })
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
        setShowRatingModal(false);
        router.push('/mobile-exact-dashboard');
      }
    } catch (error) {
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-white">Loading trade...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-white">Trade not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header with Order Details */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white bg-opacity-20 rounded-full"
          >
            <span className="text-white font-bold">←</span>
          </button>
          <h1 className="text-white font-bold text-lg">Order #{trade.id}</h1>
          <div className="w-8"></div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3 text-white">
            <div>
              <p className="text-xs opacity-80">Type</p>
              <p className="font-bold">{trade.type === 'buy' ? '🟢 BUY' : '🔴 SELL'} {trade.crypto}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Amount</p>
              <p className="font-bold">{trade.fiatAmount?.toLocaleString()} {trade.country === 'NG' ? 'NGN' : 'KES'}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Status</p>
              <p className="font-bold capitalize">{trade.status}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Time Left</p>
              <p className="font-bold">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</p>
            </div>
          </div>
        </div>

        {trade.assignedAdmin && (
          <div className="mt-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold">A</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Admin {trade.assignedAdmin}</p>
              <p className="text-xs text-white opacity-80">⭐ 4.8 • Avg response: 8 min</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-orange-500 text-white'
                    : msg.sender === 'system'
                    ? 'bg-blue-100 text-blue-800 text-center'
                    : 'bg-white text-slate-900 shadow-md'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white opacity-70' : 'text-slate-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      {trade.status === 'pending' && (
        <div className="bg-white border-t border-slate-200 p-3 space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={uploadPaymentProof}
              className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold"
            >
              📎 Upload Proof
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
            >
              ⚠️ Dispute
            </button>
          </div>
        </div>
      )}

      {trade.status === 'completed' && !trade.rated && (
        <div className="bg-white border-t border-slate-200 p-3">
          <button
            onClick={() => setShowRatingModal(true)}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
          >
            ⭐ Rate This Trade
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-slate-200 p-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Raise Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                >
                  <option value="">Select reason</option>
                  <option value="payment_not_received">Payment not received</option>
                  <option value="wrong_amount">Wrong amount sent</option>
                  <option value="admin_unresponsive">Admin unresponsive</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Evidence</label>
                <textarea
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Provide details and evidence (transaction IDs, screenshots, etc.)"
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={raiseDispute}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rate Your Experience</h3>
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-4xl"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your feedback (optional)"
                rows={3}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Skip
              </button>
              <button
                onClick={submitRating}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
