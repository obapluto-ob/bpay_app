const axios = require('axios');

class SasaPayService {
  constructor() {
    this.baseURL = process.env.SASAPAY_BASE_URL || 'https://sandbox.sasapay.app/api/v1';
    this.clientId = process.env.SASAPAY_CLIENT_ID;
    this.clientSecret = process.env.SASAPAY_CLIENT_SECRET;
    this.merchantCode = process.env.SASAPAY_MERCHANT_CODE;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseURL}/auth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      throw new Error(`SasaPay auth failed: ${error.message}`);
    }
  }

  async initiateDeposit({ amount, phoneNumber, reference, callbackUrl }) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.post(`${this.baseURL}/mpesa/stk-push`, {
        merchant_code: this.merchantCode,
        phone_number: phoneNumber,
        amount: amount,
        currency: 'KES',
        reference: reference,
        description: `BPay deposit - ${reference}`,
        callback_url: callbackUrl
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        transactionId: response.data.transaction_id,
        checkoutRequestId: response.data.checkout_request_id,
        message: 'STK push sent to phone'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async initiatePayout({ amount, phoneNumber, reference }) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.post(`${this.baseURL}/mpesa/b2c`, {
        merchant_code: this.merchantCode,
        phone_number: phoneNumber,
        amount: amount,
        currency: 'KES',
        reference: reference,
        description: `BPay withdrawal - ${reference}`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        transactionId: response.data.transaction_id,
        message: 'Payout initiated'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async checkTransactionStatus(transactionId) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`${this.baseURL}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new SasaPayService();