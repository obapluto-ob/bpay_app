import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateTrade } from '../middleware/validation';
import { TradeController } from '../controllers/TradeController';

const router = express.Router();
const tradeController = new TradeController();

// Get exchange rates
router.get('/rates', tradeController.getExchangeRates);

// Create new trade
router.post('/create', authenticateToken, validateTrade, tradeController.createTrade);

// Get user's trades
router.get('/history', authenticateToken, tradeController.getUserTrades);

// Get specific trade
router.get('/:tradeId', authenticateToken, tradeController.getTrade);

// Cancel pending trade
router.post('/:tradeId/cancel', authenticateToken, tradeController.cancelTrade);

// Upload payment proof (for manual verification)
router.post('/:tradeId/payment-proof', authenticateToken, tradeController.uploadPaymentProof);

export default router;