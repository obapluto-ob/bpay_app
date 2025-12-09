import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = 'https://bpay-app.onrender.com/api';

export default function AdminChat() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchAdmins();
    const interval = setInterval(fetchAdmins, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Get current admin info
      const profileRes = await fetch(`${API_BASE}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCurrentAdmin(profile);
      }

      // Get all admins
      const adminsRes = await fetch(`${API_BASE}/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectAdmin = async (admin: any) => {
    setSelectedAdmin(admin);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/chat/${admin.id}`, {
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
    if (!newMessage.trim() || !selectedAdmin) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedAdmin.id,
          message: newMessage
        })
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

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Admin Communication</h1>
        <p className="text-white opacity-90 text-sm mt-1">Internal chat with team members</p>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Admins List */}
        <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Team Members</h2>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-slate-500">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No admins found</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {admins
                .filter(admin => admin.id !== currentAdmin?.id)
                .map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => selectAdmin(admin)}
                    className={`w-full p-4 text-left hover:bg-slate-50 ${
                      selectedAdmin?.id === admin.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {admin.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          admin.isOnline ? 'bg-green-500' : 'bg-slate-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{admin.username}</p>
                        <p className="text-xs text-slate-500 capitalize">{admin.role || 'Admin'}</p>
                        {admin.unreadCount > 0 && (
                          <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {admin.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedAdmin ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">Select an admin to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedAdmin.username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      selectedAdmin.isOnline ? 'bg-green-500' : 'bg-slate-400'
                    }`}></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedAdmin.username}</p>
                    <p className="text-xs text-slate-500">
                      {selectedAdmin.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === currentAdmin?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.senderId === currentAdmin?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-slate-900 shadow-md'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === currentAdmin?.id ? 'text-white opacity-70' : 'text-slate-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
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
