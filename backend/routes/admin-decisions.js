const express = require('express');
const websocketService = require('../src/services/websocket');

const router = express.Router();

// Simulate admin approving a trade
router.post('/approve/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { adminId = 'admin_1', message } = req.body;
    
    const approvalMessage = {
      id: `msg_${Date.now()}`,
      tradeId,
      senderId: adminId,
      senderType: 'admin',
      message: message || `Trade ${tradeId} has been approved and completed! 🎉`,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    // Broadcast to trade chat
    websocketService.broadcastToTradeChat(tradeId, {
      type: 'new_chat_message',
      message: approvalMessage
    });
    
    res.json({
      success: true,
      message: 'Trade approved and notification sent'
    });
    
  } catch (error) {
    console.error('Error approving trade:', error);
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Simulate admin declining a trade
router.post('/decline/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { adminId = 'admin_1', reason } = req.body;
    
    const declineMessage = {
      id: `msg_${Date.now()}`,
      tradeId,
      senderId: adminId,
      senderType: 'admin',
      message: reason || `Trade ${tradeId} has been declined. Please contact support for assistance.`,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    // Broadcast to trade chat
    websocketService.broadcastToTradeChat(tradeId, {
      type: 'new_chat_message',
      message: declineMessage
    });
    
    res.json({
      success: true,
      message: 'Trade declined and notification sent'
    });
    
  } catch (error) {
    console.error('Error declining trade:', error);
    res.status(500).json({ error: 'Failed to decline trade' });
  }
});

module.exports = router;