import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdminMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastActive: string;
}

export default function AdminChat() {
  const [admin, setAdmin] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(adminData));
    loadAdminUsers();
    loadMessages();
  }, [router]);

  const loadAdminUsers = () => {
    const stored = localStorage.getItem('bpayAdminUsers');
    const admins = stored ? JSON.parse(stored) : [];
    
    // Add super admin to list if current user is not super admin
    const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (currentAdmin.role !== 'super_admin') {
      admins.unshift({
        id: 'super_admin',
        name: 'Super Admin',
        role: 'super_admin',
        isOnline: true,
        lastActive: new Date().toISOString()
      });
    }
    
    // Filter out current user and add online status
    const otherAdmins = admins
      .filter((a: any) => a.id !== currentAdmin.id)
      .map((a: any) => ({
        ...a,
        isOnline: a.lastActive && new Date(a.lastActive) > new Date(Date.now() - 30 * 60 * 1000)
      }));
    
    setAdminUsers(otherAdmins);
  };

  const loadMessages = () => {
    const stored = localStorage.getItem('adminMessages');
    const allMessages = stored ? JSON.parse(stored) : [];
    setMessages(allMessages);
    
    // Calculate unread counts
    const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const counts: Record<string, number> = {};
    
    allMessages.forEach((msg: AdminMessage) => {
      if (msg.receiverId === currentAdmin.id && !msg.read) {
        counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
      }
    });
    
    setUnreadCounts(counts);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedAdmin) return;

    const message: AdminMessage = {
      id: `msg_${Date.now()}`,
      senderId: admin.id,
      senderName: admin.name,
      receiverId: selectedAdmin.id,
      message: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    const allMessages = [...messages, message];
    setMessages(allMessages);
    localStorage.setItem('adminMessages', JSON.stringify(allMessages));
    setNewMessage('');
  };

  const markAsRead = (senderId: string) => {
    const updatedMessages = messages.map(msg => 
      msg.senderId === senderId && msg.receiverId === admin.id 
        ? { ...msg, read: true }
        : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem('adminMessages', JSON.stringify(updatedMessages));
    
    setUnreadCounts(prev => ({ ...prev, [senderId]: 0 }));
  };

  const getConversationMessages = (adminId: string) => {
    return messages.filter(msg => 
      (msg.senderId === admin.id && msg.receiverId === adminId) ||
      (msg.senderId === adminId && msg.receiverId === admin.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-800 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Support Chat</h1>
            <p className="text-gray-300">Communicate with other admins</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Admin List */}
        <div className="w-1/3 bg-white border-r">
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800">Available Admins</h3>
          </div>
          <div className="overflow-y-auto">
            {adminUsers.map(adminUser => (
              <div
                key={adminUser.id}
                onClick={() => {
                  setSelectedAdmin(adminUser);
                  markAsRead(adminUser.id);
                }}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedAdmin?.id === adminUser.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      adminUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-medium">{adminUser.name}</div>
                      <div className="text-sm text-gray-500">
                        {adminUser.role.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {unreadCounts[adminUser.id] > 0 && (
                    <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {unreadCounts[adminUser.id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedAdmin ? (
            <>
              <div className="p-4 border-b bg-white">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    selectedAdmin.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <div className="font-bold">{selectedAdmin.name}</div>
                    <div className="text-sm text-gray-500">
                      {selectedAdmin.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {getConversationMessages(selectedAdmin.id).map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === admin.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === admin.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border rounded px-3 py-2"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select an admin to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}