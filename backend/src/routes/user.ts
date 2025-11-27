import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Placeholder for user routes
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

export default router;