class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, Function[]> = new Map();
  private isAuthenticated = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;

  connect(token: string, userType: 'user' | 'admin' = 'user') {
    const wsUrl = 'wss://api.bpayapp.co.ke/ws';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Authenticate immediately
        this.send({
          type: 'auth',
          token,
          userType
        });
        
        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isAuthenticated = false;
        this.stopHeartbeat();
        this.attemptReconnect(token, userType);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private attemptReconnect(token: string, userType: 'user' | 'admin') {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token, userType);
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    // Send ping every 25 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        
        // Expect pong within 5 seconds
        this.pongTimeout = setTimeout(() => {
          console.log('Pong timeout, reconnecting...');
          this.ws?.close();
        }, 5000);
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'auth_success':
        this.isAuthenticated = true;
        console.log('WebSocket authenticated');
        break;
      case 'auth_error':
        console.error('WebSocket authentication failed:', data.message);
        break;
      case 'pong':
        // Clear pong timeout
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        break;
      default:
        // Trigger registered handlers
        const handlers = this.messageHandlers.get(data.type) || [];
        handlers.forEach(handler => handler(data));
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message not sent:', data);
    }
  }

  // Chat methods
  joinTradeChat(tradeId: string) {
    this.send({
      type: 'join_trade_chat',
      tradeId
    });
  }

  sendChatMessage(tradeId: string, message: string) {
    this.send({
      type: 'chat_message',
      tradeId,
      message
    });
  }

  sendAdminMessage(receiverId: string, message: string) {
    this.send({
      type: 'admin_chat_message',
      receiverId,
      message
    });
  }

  // Event handlers
  onMessage(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  offMessage(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }
}

export const websocketService = new WebSocketService();