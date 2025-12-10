// Simple WebSocket test script
const WebSocket = require('ws');

console.log('Testing WebSocket connection to localhost:3001...');

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  
  // Test authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'test-token',
    userType: 'user'
  }));
  
  setTimeout(() => {
    // Test chat message
    ws.send(JSON.stringify({
      type: 'chat_message',
      tradeId: 'test-trade-123',
      message: 'Hello from test script!'
    }));
  }, 1000);
  
  setTimeout(() => {
    console.log('Test completed, closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', function message(data) {
  console.log('📨 Received:', JSON.parse(data.toString()));
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});