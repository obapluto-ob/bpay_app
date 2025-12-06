export interface User {
  id: string;
  email: string;
  fullName: string;
  country: 'NG' | 'KE';
  kycStatus: 'pending' | 'processing' | 'verified' | 'rejected';
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  type: 'sell' | 'buy_request';
  crypto: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  rate: number;
  fiatAmount: number;
  status: 'pending_payment' | 'payment_uploaded' | 'verifying' | 'completed' | 'cancelled';
  paymentProof?: string;
  bankDetails?: BankDetails;
  created_at: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  country: 'NG' | 'KE';
}

export interface CryptoRate {
  buy: number;
  sell: number;
  lastUpdated: string;
}

export interface Balance {
  NGN: number;
  KES: number;
  BTC: number;
  ETH: number;
  USDT: number;
}

export interface CryptoWallet {
  BTC: string;
  ETH: string;
  USDT: string;
}

export interface CryptoDeposit {
  id: string;
  crypto: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
  read?: boolean;
}

export interface DepositMethod {
  id: string;
  type: 'bank_transfer' | 'mobile_money';
  name: string;
  details: string;
  country: 'NG' | 'KE';
  instructions: string[];
}

export interface ConversionRate {
  from: 'BTC' | 'ETH' | 'USDT';
  to: 'BTC' | 'ETH' | 'USDT';
  rate: number;
}