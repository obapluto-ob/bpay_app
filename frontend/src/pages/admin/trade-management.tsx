import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Trade {
  id: string;
  userId: string;
  userName: string;
  type: 'buy' | 'sell';
  crypto: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  fiatAmount: number;
  currency: 'NGN' | 'KES';
  status: 'pending' | 'processing' | 'completed' | 'disputed' | 'cancelled';
  assignedAdmin?: string;
  adminRating?: number;
  createdAt: string;
  paymentProof?: string;
  chatMessages: ChatMessage[];
  disputeReason?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  totalTrades: number;
  successfulTrades: number;
  averageRating: number;
  isOnline: boolean;
  responseTime: number; // in minutes
}

export default function TradeManagement() {
  const [admin, setAdmin] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [showDisputes, setShowDisputes] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(adminData));
    loadTrades();
    loadAdminUsers();
  }, [router]);

  const loadTrades = () => {
    const stored = localStorage.getItem('bpayTrades');
    const allTrades = stored ? JSON.parse(stored) : [];
    
    // Add chat messages and admin assignments if not present
    const tradesWithChat = allTrades.map((trade: any) => ({
      ...trade,
      chatMessages: trade.chatMessages || [],
      assignedAdmin: trade.assignedAdmin || null,
      adminRating: trade.adminRating || null
    }));
    
    setTrades(tradesWithChat);
  };

  const loadAdminUsers = () => {
    const stored = localStorage.getItem('bpayAdminUsers');
    const admins = stored ? JSON.parse(stored) : [];
    
    // Calculate admin stats
    const adminStats = admins.map((admin: any) => {
      const adminTrades = trades.filter(t => t.assignedAdmin === admin.id);
      const successful = adminTrades.filter(t => t.status === 'completed').length;
      const ratings = adminTrades.filter(t => t.adminRating).map(t => t.adminRating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      return {
        ...admin,
        totalTrades: adminTrades.length,
        successfulTrades: successful,
        averageRating: avgRating,
        isOnline: admin.lastActive && new Date(admin.lastActive) > new Date(Date.now() - 30 * 60 * 1000),
        responseTime: Math.floor(Math.random() * 15) + 5 // Mock response time
      };
    });
    
    setAdminUsers(adminStats);
  };

  const assignTradeToAdmin = (tradeId: string, adminId: string) => {
    const updatedTrades = trades.map(trade => 
      trade.id === tradeId 
        ? { 
            ...trade, 
            assignedAdmin: adminId,
            status: 'processing',
            chatMessages: [
              ...trade.chatMessages,
              {
                id: `msg_${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                senderType: 'admin' as const,
                message: `Trade assigned to admin. Please proceed with verification.`,
                timestamp: new Date().toISOString(),
                type: 'system' as const
              }
            ]
          }
        : trade
    );
    
    setTrades(updatedTrades);
    localStorage.setItem('bpayTrades', JSON.stringify(updatedTrades));
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !selectedTrade) return;
    
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: admin.id,
      senderName: admin.name,
      senderType: 'admin',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    
    const updatedTrades = trades.map(trade => 
      trade.id === selectedTrade.id 
        ? { ...trade, chatMessages: [...trade.chatMessages, newMessage] }
        : trade
    );
    
    setTrades(updatedTrades);
    setSelectedTrade({ ...selectedTrade, chatMessages: [...selectedTrade.chatMessages, newMessage] });
    localStorage.setItem('bpayTrades', JSON.stringify(updatedTrades));
    setChatMessage('');
  };

  const completeTrade = (tradeId: string) => {
    const updatedTrades = trades.map(trade => 
      trade.id === tradeId 
        ? { 
            ...trade, 
            status: 'completed',
            chatMessages: [
              ...trade.chatMessages,
              {
                id: `msg_${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                senderType: 'admin' as const,
                message: `Trade completed successfully! Please rate your experience.`,
                timestamp: new Date().toISOString(),
                type: 'system' as const
              }
            ]
          }
        : trade
    );
    
    setTrades(updatedTrades);
    localStorage.setItem('bpayTrades', JSON.stringify(updatedTrades));
  };

  const raiseDispute = (tradeId: string, reason: string) => {
    const updatedTrades = trades.map(trade => 
      trade.id === tradeId 
        ? { 
            ...trade, 
            status: 'disputed',
            disputeReason: reason,
            chatMessages: [
              ...trade.chatMessages,
              {
                id: `msg_${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                senderType: 'admin' as const,
                message: `Dispute raised: ${reason}. Super admin will review this case.`,
                timestamp: new Date().toISOString(),
                type: 'system' as const
              }
            ]
          }
        : trade
    );
    
    setTrades(updatedTrades);
    localStorage.setItem('bpayTrades', JSON.stringify(updatedTrades));
  };

  const getBestAdmins = () => {
    return adminUsers
      .filter(admin => admin.isOnline)
      .sort((a, b) => {
        // Sort by rating first, then by response time
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return a.responseTime - b.responseTime;
      })
      .slice(0, 3);
  };

  const pendingTrades = trades.filter(t => t.status === 'pending');
  const processingTrades = trades.filter(t => t.status === 'processing');
  const disputedTrades = trades.filter(t => t.status === 'disputed');

  if (!admin) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-800 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Trade Management</h1>
            <p className="text-gray-300">Manage user trades and disputes</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDisputes(!showDisputes)}
              className={`px-4 py-2 rounded-md ${showDisputes ? 'bg-red-600' : 'bg-gray-600'}`}
            >
              Disputes ({disputedTrades.length})
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Admin Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Top Performing Admins</h3>
            {getBestAdmins().map(admin => (
              <div key={admin.id} className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${admin.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">{admin.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">★ {admin.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{admin.totalTrades} trades</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Trade Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Pending:</span>
                <span className="font-bold text-yellow-600">{pendingTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Processing:</span>
                <span className="font-bold text-blue-600">{processingTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Disputed:</span>
                <span className="font-bold text-red-600">{disputedTrades.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-green-500 text-white py-2 px-4 rounded-md text-sm">
                Auto-Assign Trades
              </button>
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm">
                Bulk Approve
              </button>
              <button className="w-full bg-red-500 text-white py-2 px-4 rounded-md text-sm">
                Review Disputes
              </button>
            </div>
          </div>
        </div>

        {/* Trade List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800">
                {showDisputes ? 'Disputed Trades' : 'Active Trades'}
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(showDisputes ? disputedTrades : [...pendingTrades, ...processingTrades]).map(trade => (
                <div 
                  key={trade.id} 
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedTrade?.id === trade.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedTrade(trade)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{trade.userName}</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        trade.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      trade.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      trade.status === 'disputed' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {trade.amount} {trade.crypto} → {trade.currency} {trade.fiatAmount.toLocaleString()}
                  </div>
                  {trade.assignedAdmin && (
                    <div className="text-xs text-blue-600 mt-1">
                      Assigned to: {adminUsers.find(a => a.id === trade.assignedAdmin)?.name}
                    </div>
                  )}
                  {trade.disputeReason && (
                    <div className="text-xs text-red-600 mt-1">
                      Dispute: {trade.disputeReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          {selectedTrade && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">
                    Trade Chat - {selectedTrade.userName}
                  </h3>
                  <div className="flex gap-2">
                    {selectedTrade.status === 'pending' && admin.role === 'super_admin' && (
                      <select 
                        onChange={(e) => assignTradeToAdmin(selectedTrade.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="">Assign Admin</option>
                        {adminUsers.filter(a => a.isOnline).map(admin => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name} (★{admin.averageRating.toFixed(1)})
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedTrade.status === 'processing' && (
                      <button
                        onClick={() => completeTrade(selectedTrade.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {selectedTrade.chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.type === 'system' ? 'bg-gray-100 text-gray-600 text-center w-full' :
                      msg.senderType === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <button
                    onClick={sendChatMessage}
                    className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Send
                  </button>
                </div>
                
                {selectedTrade.status === 'processing' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => raiseDispute(selectedTrade.id, 'Payment verification failed')}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Raise Dispute
                    </button>
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                      Request More Info
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}