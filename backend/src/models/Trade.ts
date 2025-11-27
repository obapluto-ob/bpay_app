export interface Trade {
  id: string;
  userId: string;
  type: 'buy' | 'sell'; // buy crypto with fiat, sell crypto for fiat
  fromCurrency: string; // e.g., 'NGN', 'BTC'
  toCurrency: string; // e.g., 'BTC', 'NGN'
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'crypto_wallet';
  paymentDetails: PaymentDetails;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PaymentDetails {
  // For fiat payments
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transactionRef?: string;
  
  // For crypto payments
  walletAddress?: string;
  txHash?: string;
  
  // For mobile money (Kenya)
  mpesaNumber?: string;
  mpesaRef?: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  spread: number; // Our profit margin
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  tradeId?: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee';
  currency: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}