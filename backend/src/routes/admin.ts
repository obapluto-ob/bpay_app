import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Placeholder for admin routes
router.get('/trades/pending', authenticateToken, (req, res) => {
  res.json({ message: 'Admin pending trades endpoint' });
});

export default router;