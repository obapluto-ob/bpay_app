export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: 'NG' | 'KE'; // Nigeria or Kenya
  preferredCurrency: 'NGN' | 'KES';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWallet {
  id: string;
  userId: string;
  currency: 'NGN' | 'KES' | 'BTC' | 'ETH' | 'USDT';
  balance: number;
  lockedBalance: number; // For pending trades
  address?: string; // For crypto wallets
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}