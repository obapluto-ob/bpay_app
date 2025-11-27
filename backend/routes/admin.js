const express = require('express');
const router = express.Router();

// Get pending trades
router.get('/trades/pending', (req, res) => {
  res.json({ message: 'Admin pending trades endpoint' });
});

// Approve trade
router.post('/trades/:id/approve', (req, res) => {
  res.json({ message: 'Trade approved' });
});

// Reject trade
router.post('/trades/:id/reject', (req, res) => {
  res.json({ message: 'Trade rejected' });
});

module.exports = router;