const axios = require('axios');

class EmailFallbackService {
  constructor() {
    this.merchantCode = '53897';
  }

  // Use EmailJS or similar service as fallback
  async sendSasaPayRequest() {
    const emailData = {
      to: 'developers@sasapay.app',
      subject: 'API Credentials Request for Merchant Code 53897',
      html: `
        <h3>API Credentials Request for Merchant Code 53897</h3>
        
        <p>Dear SasaPay Development Team,</p>
        
        <p>I am writing to request API credentials for my merchant account to integrate SasaPay payment services into our platform.</p>
        
        <h4>MERCHANT DETAILS:</h4>
        <ul>
          <li><strong>Merchant Code:</strong> 53897</li>
          <li><strong>Business Name:</strong> BPay</li>
          <li><strong>Platform:</strong> Crypto-to-Cash Trading Platform</li>
          <li><strong>Website:</strong> bpayapp.co.ke</li>
          <li><strong>Country:</strong> Kenya</li>
          <li><strong>Integration Type:</strong> M-Pesa STK Push & B2C Payouts</li>
        </ul>
        
        <h4>REQUIRED CREDENTIALS:</h4>
        <ol>
          <li>API Key</li>
          <li>API Secret</li>
          <li>Client ID</li>
          <li>Sandbox Base URL</li>
          <li>Production Base URL</li>
          <li>Webhook configuration instructions</li>
        </ol>
        
        <h4>INTEGRATION PURPOSE:</h4>
        <ul>
          <li>Automated M-Pesa deposits for users buying cryptocurrency</li>
          <li>Automated M-Pesa withdrawals for users cashing out</li>
          <li>Real-time transaction status updates via webhooks</li>
          <li>Seamless user experience for crypto trading</li>
        </ul>
        
        <h4>TECHNICAL REQUIREMENTS:</h4>
        <ul>
          <li><strong>STK Push:</strong> Customer payment initiation</li>
          <li><strong>B2C Transfers:</strong> Customer payouts</li>
          <li><strong>Transaction Callbacks:</strong> Real-time status updates</li>
          <li><strong>Webhook Endpoint:</strong> https://bpay.onrender.com/api/sasapay/callback/deposit</li>
          <li><strong>Callback URL:</strong> https://bpay.onrender.com/api/sasapay/callback/status</li>
        </ul>
        
        <h4>BUSINESS INFORMATION:</h4>
        <ul>
          <li><strong>Platform:</strong> BPay Crypto Trading Platform</li>
          <li><strong>Users:</strong> Kenyan crypto traders</li>
          <li><strong>Volume:</strong> Expected 1000+ transactions/month</li>
          <li><strong>Integration Status:</strong> Code ready, awaiting credentials</li>
        </ul>
        
        <p>Our development team has already prepared the complete integration code and is ready to implement once we receive the API credentials. We have implemented proper error handling, webhook processing, and security measures.</p>
        
        <p><strong>Merchant Code: 53897</strong></p>
        <p><strong>Contact:</strong> support@bpayapp.co.ke</p>
        <p><strong>Platform:</strong> bpayapp.co.ke</p>
        
        <p>We would appreciate your prompt response as we are eager to launch this integration for our Kenyan users.</p>
        
        <p>Best regards,<br>
        BPay Development Team<br>
        <strong>Merchant Code: 53897</strong></p>
      `,
      from: 'BPay Support <support@bpayapp.co.ke>'
    };

    try {
      // Try multiple email services
      console.log('📧 Attempting to send SasaPay API request...');
      console.log('📧 Merchant Code: 53897');
      console.log('📧 Target: developers@sasapay.app');
      
      // For now, return the email content for manual sending
      return {
        success: true,
        message: 'Email content prepared for SasaPay API request',
        merchantCode: '53897',
        emailContent: emailData,
        instructions: 'Send this email manually to developers@sasapay.app'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        merchantCode: '53897'
      };
    }
  }

  // Generate complete email template
  getEmailTemplate() {
    return {
      to: 'developers@sasapay.app',
      subject: 'API Credentials Request for Merchant Code 53897',
      body: `Dear SasaPay Development Team,

I am writing to request API credentials for merchant code 53897 to integrate SasaPay payment services into our BPay crypto trading platform.

MERCHANT DETAILS:
- Merchant Code: 53897
- Business Name: BPay
- Platform: Crypto-to-Cash Trading Platform  
- Website: bpayapp.co.ke
- Country: Kenya
- Integration Type: M-Pesa STK Push & B2C Payouts

REQUIRED CREDENTIALS:
1. API Key
2. API Secret
3. Client ID
4. Sandbox Base URL
5. Production Base URL
6. Webhook configuration instructions

INTEGRATION PURPOSE:
- Automated M-Pesa deposits for crypto purchases
- Automated M-Pesa withdrawals for cash-outs
- Real-time transaction status updates via webhooks
- Seamless user experience for crypto trading

TECHNICAL REQUIREMENTS:
- STK Push for customer payment initiation
- B2C transfers for customer payouts
- Transaction callbacks for real-time status updates
- Webhook endpoint: https://bpay.onrender.com/api/sasapay/callback/deposit
- Callback URL: https://bpay.onrender.com/api/sasapay/callback/status

BUSINESS INFORMATION:
- Platform: BPay Crypto Trading Platform
- Target Users: Kenyan crypto traders
- Expected Volume: 1000+ transactions/month
- Integration Status: Code ready, awaiting credentials

Our development team has prepared the complete integration code with proper error handling, webhook processing, and security measures. We are ready to implement immediately upon receiving the API credentials.

Merchant Code: 53897
Contact: support@bpayapp.co.ke
Platform: bpayapp.co.ke

We would appreciate your prompt response as we are eager to launch this integration for our Kenyan users.

Best regards,
BPay Development Team
Merchant Code: 53897`
    };
  }
}

module.exports = new EmailFallbackService();