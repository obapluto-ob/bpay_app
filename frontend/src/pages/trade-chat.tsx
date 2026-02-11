import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';
const WS_URL = 'wss://bpay-app.onrender.com/ws';

export default function TradeChatScreen() {
  const router = useRouter();
  const { tradeId } = router.query;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [trade, setTrade] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [proofImage, setProofImage] = useState('');
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [orderDetailsSent, setOrderDetailsSent] = useState(false);
  const [adminReplied, setAdminReplied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tradeId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Fetch trade details and messages once
    fetchTrade();
    fetchMessages();

    // Connect WebSocket
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      websocket.send(JSON.stringify({
        type: 'auth',
        token,
        userType: 'user'
      }));
      
      websocket.send(JSON.stringify({
        type: 'join_trade_chat',
        tradeId
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_chat_message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [tradeId]);

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
        
        // Check if admin replied
        const hasAdminReply = data.some((msg: any) => msg.sender_type === 'admin');
        setAdminReplied(hasAdminReply);
        
        // Send order details only once if no messages exist
        if (data.length === 0 && !orderDetailsSent && trade) {
          sendOrderDetails(trade);
        }
        
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendOrderDetails = async (tradeData: any) => {
    if (orderDetailsSent) return;
    
    const orderDetails = `NEW ORDER CREATED

Order ID: #${tradeData.id}
Type: ${tradeData.type.toUpperCase()}
Crypto: ${tradeData.crypto}
Amount: ${tradeData.crypto_amount} ${tradeData.crypto}
Fiat: ${tradeData.country === 'NG' ? 'NGN' : 'KES'} ${parseFloat(tradeData.fiat_amount).toLocaleString()}
Payment Method: ${tradeData.payment_method}
Time: ${new Date(tradeData.created_at).toLocaleString()}

Status: Waiting for admin to send payment details`;

    await sendMessage(orderDetails, 'system');
    setOrderDetailsSent(true);
  };

  const sendPaymentDetails = async () => {
    const paymentDetails = trade.country === 'NG' 
      ? `PAYMENT DETAILS (Nigeria)

Bank: GLOBUS BANK
Account: 1000461745
Name: GLOBAL BURGERS NIGERIA LIMITED

Amount to Pay: NGN ${parseFloat(trade.fiat_amount).toLocaleString()}

Use Order ID as reference: ${trade.id}
Complete payment within 15 minutes`
      : `PAYMENT DETAILS (Kenya)

Paybill: 756756
Account: 53897
Business: BPay Kenya

Amount to Pay: KES ${parseFloat(trade.fiat_amount).toLocaleString()}

Use Order ID as reference: ${trade.id}
Complete payment within 15 minutes`;

    sendMessage(paymentDetails, 'system');
  };

  const sendMessage = async (message: string, type: string = 'text') => {
    if (!message.trim() && type === 'text') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/trade/${tradeId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message, type })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh immediately
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'chat_message',
            tradeId,
            message
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    await sendMessage('I have completed the payment', 'text');
    setShowProofUpload(true);
  };

  const handleUploadProof = async () => {
    if (!proofImage) {
      alert('Please upload payment proof');
      return;
    }

    // Send proof to backend first
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/trade/${tradeId}/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ proof: proofImage })
      });
      
      // Send image link in chat
      await sendMessage(proofImage, 'image');
      
      setShowProofUpload(false);
      setProofImage('');
      setProofUploaded(true);
      
      // Auto-send reminder to admin
      setTimeout(() => {
        sendMessage('Please verify my payment proof and complete the transaction', 'text');
      }, 1000);
      
      alert('Payment proof submitted! Admin will verify shortly.');
    } catch (error) {
      alert('Failed to upload proof');
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please enter dispute reason');
      return;
    }

    await sendMessage(`DISPUTE RAISED: ${disputeReason}`, 'text');
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/trade/${tradeId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: disputeReason })
      });
      
      setShowDispute(false);
      setDisputeReason('');
      alert('Dispute raised. Admin will investigate.');
    } catch (error) {
      alert('Failed to raise dispute');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Success screen when trade is completed
  if (trade?.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl text-white">✓</span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Success!</h1>
          <p className="text-lg text-slate-600 mb-6">
            {trade.crypto_amount} {trade.crypto} added to your wallet
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600">Order ID</span>
              <span className="font-bold text-slate-900">#{trade.id}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600">Amount</span>
              <span className="font-bold text-slate-900">{trade.crypto_amount} {trade.crypto}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Paid</span>
              <span className="font-bold text-slate-900">
                {trade.country === 'NG' ? '₦' : 'KSh'}{parseFloat(trade.fiat_amount).toLocaleString()}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/mobile-exact-dashboard')}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg mb-3 hover:bg-green-600"
          >
            View My Wallet
          </button>
          
          <button
            onClick={() => router.push('/mobile-exact-dashboard')}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-orange-500 p-3 md:p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.back()} className="text-white p-1">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-base md:text-lg">Trade Chat</h1>
            <p className="text-orange-100 text-xs">#{trade?.id?.slice(0, 15)}...</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={() => setShowDispute(true)}
            className="bg-red-500 text-white px-2 md:px-3 py-1 rounded-lg text-xs font-semibold"
          >
            Dispute
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                msg.sender_type === 'user'
                  ? 'bg-orange-500 text-white'
                  : msg.message_type === 'system'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-white text-slate-900'
              }`}
            >
              {msg.message_type === 'image' ? (
                <img src={msg.message} alt="Proof" className="rounded-lg max-w-full" />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Mark as Paid Button - Only show after admin replies and proof not uploaded */}
      {trade?.status === 'pending' && !showProofUpload && !proofUploaded && adminReplied && (
        <div className="p-4 bg-white border-t">
          <button
            onClick={handleMarkAsPaid}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold"
          >
            I Have Paid
          </button>
        </div>
      )}

      {/* Proof Upload */}
      {showProofUpload && (
        <div className="p-4 bg-white border-t space-y-3">
          <p className="text-sm text-slate-600 font-semibold">Upload Payment Proof:</p>
          {!proofImage ? (
            <label className="block bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-200">
              <span className="text-slate-600">Take Photo or Choose File</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setProofImage(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative">
              <img src={proofImage} alt="Proof" className="w-full rounded-xl" />
              <button
                onClick={() => setProofImage('')}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={handleUploadProof}
            disabled={!proofImage}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            Submit Proof
          </button>
        </div>
      )}

      {/* Message Input */}
      {!showProofUpload && (
        <div className="p-4 bg-white border-t flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            placeholder="Type a message..."
            className="flex-1 border border-slate-300 rounded-full px-4 py-2"
          />
          <button
            onClick={() => sendMessage(newMessage)}
            className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Raise Dispute</h3>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDispute(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDispute}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
