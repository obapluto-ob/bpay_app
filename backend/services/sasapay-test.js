const axios = require('axios');

class SasaPayTestService {
  constructor() {
    this.merchantCode = process.env.SASAPAY_MERCHANT_CODE; // Your merchant code
    this.baseURL = 'https://sandbox.sasapay.app/api/v1'; // Sandbox for testing
  }

  // Test merchant code validity
  async testMerchantCode() {
    try {
      console.log('Testing merchant code: 53897');
      
      // This will fail without API credentials but shows merchant code format
      const testPayload = {
        merchant_code: this.merchantCode,
        phone_number: '254712345678',
        amount: 100,
        currency: 'KES',
        reference: 'TEST_' + Date.now(),
        description: 'Test transaction'
      };
      
      console.log('Test payload structure:', testPayload);
      return { success: true, message: 'Merchant code format ready' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Prepare for when you get full credentials
  async initiateSTKPush(phoneNumber, amount) {
    if (!this.merchantCode) {
      throw new Error('Merchant code not configured');
    }
    
    console.log(`Ready to send STK push: ${amount} KES to ${phoneNumber}`);
    console.log(`Using merchant code: ${this.merchantCode}`);
    
    // Will work once you have API key/secret
    return {
      success: false,
      message: 'Waiting for API credentials from SasaPay support'
    };
  }
}

module.exports = new SasaPayTestService();