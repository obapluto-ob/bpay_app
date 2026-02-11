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

    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      setCurrentAdmin(JSON.parse(adminUser));
    }

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Get all admins
      const adminsRes = await fetch(`${API_BASE}/adminAuth/list`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-orange-600">C</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Admin Chat</h1>
              <p className="text-xs md:text-sm text-orange-100">Internal team communication</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-orange-50 shadow-lg transition-all">← Dashboard</button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Admins List */}
        <div className="w-full md:w-1/3 bg-slate-800 bg-opacity-50 backdrop-blur-lg border-r border-white border-opacity-10 overflow-y-auto">
          <div className="p-4 border-b border-white border-opacity-10">
            <h2 className="font-bold text-white text-lg">Team Members</h2>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-slate-400">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No admins found</div>
          ) : (
            <div className="divide-y divide-white divide-opacity-5">
              {admins
                .filter(admin => admin.id !== currentAdmin?.id)
                .map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => selectAdmin(admin)}
                    className={`w-full p-4 text-left hover:bg-white hover:bg-opacity-5 transition-all ${
                      selectedAdmin?.id === admin.id ? 'bg-orange-500 bg-opacity-20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {admin.name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          admin.isOnline ? 'bg-green-500' : 'bg-slate-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{admin.name || admin.email}</p>
                        <p className="text-xs text-slate-400 capitalize">{admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
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
        <div className="flex-1 flex flex-col bg-slate-900">
          {!selectedAdmin ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-6xl mb-4 font-bold text-slate-600">CHAT</div>
                <p className="text-lg text-white">Select an admin to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg border-b border-white border-opacity-10 p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {selectedAdmin.name?.[0]?.toUpperCase() || selectedAdmin.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      selectedAdmin.isOnline ? 'bg-green-500' : 'bg-slate-400'
                    }`}></div>
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedAdmin.name || selectedAdmin.email}</p>
                    <p className="text-xs text-slate-300">
                      {selectedAdmin.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === currentAdmin?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-lg ${
                          msg.senderId === currentAdmin?.id
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                            : 'bg-slate-800 text-white border border-white border-opacity-10'
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
                    disabled={!newMessage.trim()}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg"
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
