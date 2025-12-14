const axios = require('axios');
const crypto = require('crypto');

class LunoService {
  constructor() {
    this.baseURL = process.env.LUNO_BASE_URL || 'https://api.luno.com/api/1';
    this.apiKey = process.env.LUNO_API_KEY;
    this.apiSecret = process.env.LUNO_API_SECRET;
    this.accountId = process.env.LUNO_ACCOUNT_ID;
  }

  getAuthConfig() {
    return {
      auth: {
        username: this.apiKey,
        password: this.apiSecret
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  async getBalance() {
    try {
      const path = '/balance';
      const config = this.getAuthConfig();
      
      const response = await axios.get(`${this.baseURL}${path}`, config);
      return {
        success: true,
        balances: response.data.balance
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async createReceiveAddress(currency) {
    try {
      const path = '/funding_address';
      const body = JSON.stringify({ asset: currency });
      const headers = this.createAuthHeaders('POST', path, body);
      
      const response = await axios.post(`${this.baseURL}${path}`, { asset: currency }, { headers });
      return {
        success: true,
        address: response.data.address,
        addressId: response.data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async sendCrypto({ currency, amount, address, reference }) {
    try {
      const path = '/send';
      const body = JSON.stringify({
        amount: amount.toString(),
        currency,
        address,
        description: reference || 'BPay withdrawal'
      });
      const headers = this.createAuthHeaders('POST', path, body);
      
      const response = await axios.post(`${this.baseURL}${path}`, {
        amount: amount.toString(),
        currency,
        address,
        description: reference || 'BPay withdrawal'
      }, { headers });
      
      return {
        success: true,
        withdrawalId: response.data.withdrawal_id,
        fee: response.data.fee
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getTransactionHistory(currency, limit = 100) {
    try {
      const path = `/listTransactions`;
      const headers = this.createAuthHeaders('GET', path);
      
      const response = await axios.get(`${this.baseURL}${path}`, {
        headers,
        params: { min_row: 1, max_row: limit }
      });
      
      return {
        success: true,
        transactions: response.data.transactions
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getWithdrawalStatus(withdrawalId) {
    try {
      const path = `/withdrawals/${withdrawalId}`;
      const headers = this.createAuthHeaders('GET', path);
      
      const response = await axios.get(`${this.baseURL}${path}`, { headers });
      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new LunoService();