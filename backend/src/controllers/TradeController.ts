import { Request, Response } from 'express';
import { createError } from '../middleware/errorHandler';
import { TradeService } from '../services/TradeService';
import { ExchangeRateService } from '../services/ExchangeRateService';

export class TradeController {
  private tradeService = new TradeService();
  private exchangeRateService = new ExchangeRateService();

  getExchangeRates = async (req: Request, res: Response) => {
    try {
      const rates = await this.exchangeRateService.getCurrentRates();
      res.json({ rates });
    } catch (error) {
      throw createError('Failed to fetch exchange rates', 500);
    }
  };

  createTrade = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { type, fromCurrency, toCurrency, fromAmount, paymentMethod, paymentDetails } = req.body;

      // Calculate exchange rate and fees
      const rate = await this.exchangeRateService.getRate(fromCurrency, toCurrency);
      const fee = this.tradeService.calculateFee(fromAmount, type);
      const toAmount = this.tradeService.calculateToAmount(fromAmount, rate, fee, type);

      const trade = await this.tradeService.createTrade({
        userId,
        type,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        exchangeRate: rate,
        fee,
        paymentMethod,
        paymentDetails
      });

      res.status(201).json({ 
        trade,
        message: 'Trade created successfully. Please complete payment and upload proof for verification.'
      });
    } catch (error: any) {
      throw createError(error.message || 'Failed to create trade', 400);
    }
  };

  getUserTrades = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20, status } = req.query;
      
      const trades = await this.tradeService.getUserTrades(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string
      });

      res.json({ trades });
    } catch (error) {
      throw createError('Failed to fetch trades', 500);
    }
  };

  getTrade = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tradeId } = req.params;

      const trade = await this.tradeService.getTrade(tradeId, userId);
      if (!trade) {
        throw createError('Trade not found', 404);
      }

      res.json({ trade });
    } catch (error: any) {
      throw createError(error.message || 'Failed to fetch trade', 500);
    }
  };

  cancelTrade = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tradeId } = req.params;

      await this.tradeService.cancelTrade(tradeId, userId);
      res.json({ message: 'Trade cancelled successfully' });
    } catch (error: any) {
      throw createError(error.message || 'Failed to cancel trade', 400);
    }
  };

  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { tradeId } = req.params;
      const { proofUrl, transactionRef } = req.body;

      await this.tradeService.uploadPaymentProof(tradeId, userId, proofUrl, transactionRef);
      res.json({ message: 'Payment proof uploaded. Trade is now under review.' });
    } catch (error: any) {
      throw createError(error.message || 'Failed to upload payment proof', 400);
    }
  };
}