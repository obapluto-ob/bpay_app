const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.adminClients = new Map(); // adminId -> WebSocket connection
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        this.authenticateClient(ws, data);
        break;
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
      case 'join_trade_chat':
        this.joinTradeChat(ws, data);
        break;
      case 'admin_chat_message':
        this.handleAdminChatMessage(ws, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  authenticateClient(ws, data) {
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      ws.userId = decoded.userId;
      ws.userType = data.userType || 'user'; // 'user' or 'admin'
      
      if (ws.userType === 'admin') {
        this.adminClients.set(ws.userId, ws);
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'Admin authenticated'
        }));
      } else {
        this.clients.set(ws.userId, ws);
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'User authenticated'
        }));
      }
      
      console.log(`${ws.userType} ${ws.userId} connected`);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Invalid token'
      }));
      ws.close();
    }
  }

  joinTradeChat(ws, data) {
    ws.tradeId = data.tradeId;
    ws.send(JSON.stringify({
      type: 'joined_trade_chat',
      tradeId: data.tradeId
    }));
  }

  handleChatMessage(ws, data) {
    const message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      tradeId: data.tradeId,
      senderId: ws.userId,
      senderType: ws.userType,
      message: data.message,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Send to all clients in this trade chat
    this.broadcastToTradeChat(data.tradeId, {
      type: 'new_chat_message',
      message
    });

    // Store message in database (you can implement this)
    this.storeChatMessage(message);
  }

  handleAdminChatMessage(ws, data) {
    const message = {
      id: `admin_msg_${Date.now()}_${Math.random()}`,
      senderId: ws.userId,
      receiverId: data.receiverId,
      message: data.message,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Send to specific admin
    const targetAdmin = this.adminClients.get(data.receiverId);
    if (targetAdmin) {
      targetAdmin.send(JSON.stringify({
        type: 'new_admin_message',
        message
      }));
    }

    // Send back to sender for confirmation
    ws.send(JSON.stringify({
      type: 'admin_message_sent',
      message
    }));
  }

  broadcastToTradeChat(tradeId, data) {
    // Send to all users and admins in this trade
    [...this.clients.values(), ...this.adminClients.values()].forEach(client => {
      if (client.tradeId === tradeId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  sendToAdmin(adminId, data) {
    const admin = this.adminClients.get(adminId);
    if (admin && admin.readyState === WebSocket.OPEN) {
      admin.send(JSON.stringify(data));
    }
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      if (ws.userType === 'admin') {
        this.adminClients.delete(ws.userId);
        console.log(`Admin ${ws.userId} disconnected`);
      } else {
        this.clients.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected`);
      }
    }
  }

  async storeChatMessage(message) {
    try {
      await pool.query(`
        INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type)
        VALUES ($1, $2, $3, $4, $5)
      `, [message.tradeId, message.senderId, message.senderType, message.message, message.type]);
      
      console.log('Message stored in database');
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }
}

module.exports = new WebSocketService();