import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import { apiService } from '../services/api';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
}

export const useChat = (tradeId: string, userToken: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load message history
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://bpay-app.onrender.com/api/chat/trade/${tradeId}/messages`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_type === 'user' ? 'You' : 'Admin',
          senderType: msg.sender_type,
          message: msg.message,
          timestamp: msg.created_at,
          type: msg.message_type
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tradeId, userToken]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || !websocketService.isConnected()) {
      // Fallback to REST API if WebSocket not connected
      fetch(`https://bpay-app.onrender.com/api/chat/trade/${tradeId}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }).catch(error => {
        console.error('Failed to send message via REST:', error);
      });
      return;
    }

    websocketService.sendChatMessage(tradeId, message);
  }, [tradeId, userToken]);

  useEffect(() => {
    // Load initial messages
    loadMessages();

    // Join trade chat room
    websocketService.joinTradeChat(tradeId);

    // Listen for connection status
    const checkConnection = () => {
      setIsConnected(websocketService.isConnected());
    };

    const connectionInterval = setInterval(checkConnection, 1000);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.message.tradeId === tradeId) {
        const newMessage: ChatMessage = {
          id: data.message.id,
          senderId: data.message.senderId,
          senderName: data.message.senderType === 'user' ? 'You' : 'Admin',
          senderType: data.message.senderType,
          message: data.message.message,
          timestamp: data.message.timestamp,
          type: data.message.type
        };
        
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    websocketService.onMessage('new_chat_message', handleNewMessage);

    return () => {
      clearInterval(connectionInterval);
      websocketService.offMessage('new_chat_message', handleNewMessage);
    };
  }, [tradeId, loadMessages]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    refreshMessages: loadMessages
  };
};