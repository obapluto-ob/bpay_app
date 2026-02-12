const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.adminClients = new Map(); // adminId -> WebSocket connection
    this.maxConnections = 1000; // Limit connections
    this.cleanupInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      maxPayload: 100 * 1024, // 100KB max message size
      perMessageDeflate: false // Disable compression to save memory
    });

    // Cleanup dead connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000);

    this.wss.on('connection', (ws, req) => {
      // Limit total connections
      if (this.clients.size + this.adminClients.size >= this.maxConnections) {
        ws.close(1008, 'Server at capacity');
        return;
      }

      console.log('New WebSocket connection');
      ws.isAlive = true;
      
      // Ping-pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
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
        this.handleDisconnection(ws);
      });
    });

    // Ping all connections every 30 seconds
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized');
  }

  cleanupDeadConnections() {
    let cleaned = 0;
    
    // Clean user connections
    for (const [userId, ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        this.clients.delete(userId);
        cleaned++;
      }
    }
    
    // Clean admin connections
    for (const [adminId, ws] of this.adminClients.entries()) {
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        this.adminClients.delete(adminId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} dead connections. Active: ${this.clients.size + this.adminClients.size}`);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        this.authenticateClient(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
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
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'fallback-secret');
      ws.userId = decoded.id || decoded.userId; // Support both id and userId
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
      console.error('Auth error:', error);
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
    
    // Clear all references
    ws.userId = null;
    ws.userType = null;
    ws.tradeId = null;
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clients.clear();
    this.adminClients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('WebSocket service shut down');
  }

  async storeChatMessage(message) {
    try {
      if (!message.senderId) {
        console.error('Cannot store message: sender_id is null');
        return;
      }

      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type)
          VALUES ($1, $2, $3, $4, $5)
        `, [message.tradeId, message.senderId, message.senderType || 'user', message.message, message.type || 'text']);
        
        console.log('Message stored in database');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }
}

module.exports = new WebSocketService();