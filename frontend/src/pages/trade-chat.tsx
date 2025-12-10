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
  const [paymentProofUploaded, setPaymentProofUploaded] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

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
          <p className="text-xs text-slate-300">
            Order: #{trade?.id?.slice(-8) || 'N/A'}
          </p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Trade Details */}
      <div className="bg-white p-4 border-b">
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <p className="text-slate-600">Amount</p>
            <p className="font-bold">{trade?.fiatAmount} {trade?.country === 'NG' ? 'NGN' : 'KES'}</p>
          </div>
          <div>
            <p className="text-slate-600">Crypto</p>
            <p className="font-bold">{parseFloat(trade?.cryptoAmount || 0).toFixed(6)} {trade?.crypto}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Admin Status:</span>
          <span className={`font-semibold ${adminOnline ? 'text-green-600' : 'text-red-600'}`}>
            {adminOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
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
          {!paymentProofUploaded ? (
            <div className="flex space-x-2">
              <label className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold text-sm text-center cursor-pointer">
                Take Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const imageData = event.target?.result as string;
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ 
                              message: `📸 PAYMENT PROOF UPLOADED\n\nI have completed the payment. Please verify and approve my order.`,
                              imageData
                            })
                          });
                          if (response.ok) {
                            setPaymentProofUploaded(true);
                            alert('Payment proof uploaded! Admin will verify shortly.');
                            fetchMessages();
                          }
                        } catch (error) {
                          alert('Failed to upload payment proof');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <label className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm text-center cursor-pointer">
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const imageData = event.target?.result as string;
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ 
                              message: `📸 PAYMENT PROOF UPLOADED\n\nI have completed the payment. Please verify and approve my order.`,
                              imageData
                            })
                          });
                          if (response.ok) {
                            setPaymentProofUploaded(true);
                            alert('Payment proof uploaded! Admin will verify shortly.');
                            fetchMessages();
                          }
                        } catch (error) {
                          alert('Failed to upload payment proof');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <button
              onClick={() => {
                const adminMessage = `🔔 ADMIN ALERT\n\nHello admin, I have uploaded my payment proof. Please verify and approve my order. Thank you!`;
                const token = localStorage.getItem('token');
                fetch(`${API_BASE}/trade/${tradeId}/chat`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ message: adminMessage })
                }).then(() => {
                  alert('Admin has been notified!');
                  fetchMessages();
                });
              }}
              className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold text-sm"
            >
              🔔 Alert Admin
            </button>
          )}
            <button
              onClick={() => {
                const modal = document.createElement('div');
                modal.innerHTML = `
                  <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999">
                    <div style="background:white;padding:24px;border-radius:12px;max-width:500px;width:90%">
                      <h3 style="font-size:18px;font-weight:bold;margin-bottom:16px;color:#1e293b">Raise Dispute</h3>
                      <p style="font-size:14px;color:#64748b;margin-bottom:16px">Order ID: ${trade?.id}</p>
                      
                      <label style="display:block;font-weight:bold;margin-bottom:8px;color:#1e293b">Reason for Dispute *</label>
                      <select id="disputeReason" style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:16px">
                        <option value="">Select reason...</option>
                        <option value="payment_not_received">Payment not received</option>
                        <option value="crypto_not_received">Crypto not received</option>
                        <option value="wrong_amount">Wrong amount sent</option>
                        <option value="admin_unresponsive">Admin not responding</option>
                        <option value="other">Other issue</option>
                      </select>
                      
                      <label style="display:block;font-weight:bold;margin-bottom:8px;color:#1e293b">Transaction Reference/Proof *</label>
                      <input id="txRef" type="text" placeholder="Bank reference, TxID, or receipt number" style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:16px" />
                      
                      <label style="display:block;font-weight:bold;margin-bottom:8px;color:#1e293b">Detailed Explanation *</label>
                      <textarea id="disputeDetails" rows="4" placeholder="Explain what happened and provide evidence..." style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:16px"></textarea>
                      
                      <div style="background:#fef3c7;padding:12px;border-radius:8px;border-left:4px solid #f59e0b;margin-bottom:16px">
                        <p style="font-size:12px;color:#92400e">⚠️ False disputes may result in account suspension. Only raise disputes for genuine issues.</p>
                      </div>
                      
                      <div style="display:flex;gap:8px">
                        <button id="cancelDispute" style="flex:1;padding:12px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Cancel</button>
                        <button id="submitDispute" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Submit Dispute</button>
                      </div>
                    </div>
                  </div>
                `;
                document.body.appendChild(modal);
                
                document.getElementById('cancelDispute')!.onclick = () => modal.remove();
                document.getElementById('submitDispute')!.onclick = async () => {
                  const reason = (document.getElementById('disputeReason') as HTMLSelectElement).value;
                  const txRef = (document.getElementById('txRef') as HTMLInputElement).value;
                  const details = (document.getElementById('disputeDetails') as HTMLTextAreaElement).value;
                  
                  if (!reason || !txRef || !details) {
                    alert('Please fill all required fields');
                    return;
                  }
                  
                  if (details.length < 20) {
                    alert('Please provide more detailed explanation (minimum 20 characters)');
                    return;
                  }
                  
                  try {
                    const token = localStorage.getItem('token');
                    const evidence = `Transaction Ref: ${txRef}\n\nDetails: ${details}`;
                    const response = await fetch(`${API_BASE}/trade/${tradeId}/dispute`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ reason, evidence })
                    });
                    
                    const data = await response.json();
                    if (response.ok) {
                      alert('Dispute raised successfully! Admin will review within 24 hours.');
                      modal.remove();
                      fetchTradeDetails();
                      fetchMessages();
                    } else {
                      alert(data.error || 'Failed to raise dispute');
                    }
                  } catch (error) {
                    alert('Network error. Please try again.');
                  }
                };
              }}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm"
            >
              ⚠ Raise Dispute
            </button>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
            <h4 className="font-bold text-red-800 text-xs mb-1">⚠️ IMPORTANT WARNINGS</h4>
            <div className="text-xs text-red-700 space-y-1">
              <p>• Upload REAL payment proof only</p>
              <p>• Fake screenshots = Account suspension</p>
              <p>• Wait for admin approval - DO NOT self-complete</p>
              <p>• False disputes may result in permanent ban</p>
              <p>• Only raise disputes for genuine payment issues</p>
            </div>
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
