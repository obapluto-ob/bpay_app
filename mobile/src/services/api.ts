import { User, Trade, CryptoRate, BankDetails, Notification, CryptoWallet } from '../types';

const API_BASE = 'https://bpay-app.onrender.com/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
  }) {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User APIs
  async getProfile(token: string) {
    return this.request<User>('/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  
  async getUserProfile(token: string): Promise<User> {
    try {
      return await this.request<User>('/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Mock fallback with KYC status
      return {
        id: '1',
        email: 'user@example.com',
        fullName: 'John Doe',
        country: 'NG',
        kycStatus: 'pending',
        isVerified: false,
        createdAt: new Date().toISOString()
      };
    }
  }

  async getBalance(token: string) {
    try {
      return await this.request<{ NGN: number; KES: number; BTC: number; ETH: number; USDT: number }>('/user/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return { NGN: 0, KES: 0, BTC: 0, ETH: 0, USDT: 0 };
    }
  }

  // Trading APIs
  async getRates(): Promise<Record<string, CryptoRate>> {
    try {
      return await this.request<Record<string, CryptoRate>>('/trade/rates');
    } catch {
      // Fallback rates for offline mode
      return {
        BTC: { buy: 45250000, sell: 44750000, lastUpdated: new Date().toISOString() },
        ETH: { buy: 2850000, sell: 2820000, lastUpdated: new Date().toISOString() },
        USDT: { buy: 1580, sell: 1570, lastUpdated: new Date().toISOString() },
      };
    }
  }

  async createTrade(data: {
    type: 'buy' | 'sell';
    crypto: string;
    fiatAmount?: number;
    cryptoAmount?: number;
    amount?: number;
    paymentMethod?: string;
    country?: 'NG' | 'KE';
    bankDetails?: BankDetails;
  }, token: string) {
    return this.request<{ trade: Trade }>('/trade/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async uploadPaymentProof(tradeId: string, proof: string, token: string) {
    return this.request<{ message: string }>(`/trade/${tradeId}/payment-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentProof: proof }),
    });
  }

  async getTradeHistory(token: string): Promise<Trade[]> {
    try {
      return await this.request<Trade[]>('/trade/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return [];
    }
  }
  
  async submitKYC(token: string, kycData: any): Promise<any> {
    try {
      return await this.request<any>('/user/kyc', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(kycData),
      });
    } catch {
      // Mock response
      return { 
        success: true, 
        message: 'KYC submitted successfully',
        kycStatus: 'processing'
      };
    }
  }
  
  async submitDeposit(token: string, depositData: any): Promise<any> {
    try {
      return await this.request<any>('/user/deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(depositData),
      });
    } catch {
      // Mock response
      return { 
        success: true, 
        message: 'Deposit submitted for verification',
        depositId: Date.now().toString()
      };
    }
  }
  
  async getCryptoWallets(token: string): Promise<CryptoWallet> {
    try {
      return await this.request<CryptoWallet>('/user/crypto-wallets', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Mock wallet addresses
      return {
        BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        ETH: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e4e4',
        USDT: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e4e4'
      };
    }
  }
  
  async verifyDeposit(token: string, depositData: { crypto: string; txHash: string; amount: number }): Promise<any> {
    try {
      return await this.request<any>('/crypto/verify-deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(depositData),
      });
    } catch {
      // Mock verification - simulate blockchain API check
      const isValidTx = depositData.txHash.length >= 40; // Basic validation
      return {
        verified: isValidTx,
        amount: depositData.amount,
        confirmations: isValidTx ? 6 : 0
      };
    }
  }
  
  async convertCrypto(token: string, conversionData: any): Promise<any> {
    try {
      return await this.request<any>('/crypto/convert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(conversionData),
      });
    } catch {
      // Mock conversion
      return {
        success: true,
        fromAmount: conversionData.amount,
        toAmount: conversionData.amount * conversionData.rate,
        rate: conversionData.rate
      };
    }
  }
  
  // Admin APIs
  async getAvailableAdmins(token: string) {
    try {
      return await this.request<{ admins: any[] }>('/admin/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return { admins: [] };
    }
  }
  
  async assignAdminToTrade(tradeId: string, adminId: string, token: string) {
    try {
      return await this.request<any>(`/trade/${tradeId}/assign-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminId }),
      });
    } catch {
      return { success: false };
    }
  }
  
  async getTrade(tradeId: string, token: string) {
    try {
      return await this.request<any>(`/trade/${tradeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return null;
    }
  }
  
  async uploadAvatar(token: string, imageUri: string): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
      
      const response = await fetch(`${API_BASE}/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    } catch {
      // Mock response - return the local URI for now
      return { avatarUrl: imageUri };
    }
  }
}

export const apiService = new ApiService();