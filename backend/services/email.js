const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('🔧 Email Service Configuration:');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'mail.bpayapp.co.ke',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // Use STARTTLS for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true,
      logger: true
    });
  }

  async sendSasaPayRequest() {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'support@yourdomain.com',
      to: 'developers@sasapay.app', // SasaPay developer email
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
          <li><strong>Country:</strong> Kenya</li>
          <li><strong>Integration Type:</strong> M-Pesa STK Push & B2C Payouts</li>
        </ul>
        
        <h4>REQUIRED CREDENTIALS:</h4>
        <ol>
          <li>API Key</li>
          <li>API Secret</li>
          <li>Client ID</li>
          <li>Sandbox Base URL</li>
          <li>Webhook configuration instructions</li>
        </ol>
        
        <h4>INTEGRATION PURPOSE:</h4>
        <ul>
          <li>Automated M-Pesa deposits for users buying cryptocurrency</li>
          <li>Automated M-Pesa withdrawals for users cashing out</li>
          <li>Real-time transaction status updates via webhooks</li>
        </ul>
        
        <h4>TECHNICAL REQUIREMENTS:</h4>
        <ul>
          <li>STK Push for customer payments</li>
          <li>B2C transfers for customer payouts</li>
          <li>Transaction status callbacks</li>
          <li><strong>Webhook endpoint:</strong> https://bpay.onrender.com/api/sasapay/callback/deposit</li>
        </ul>
        
        <p>Our development team has already prepared the integration code and is ready to implement once we receive the API credentials.</p>
        
        <p>We would appreciate your prompt response as we are eager to launch this integration for our Kenyan users.</p>
        
        <p>Best regards,<br>
        BPay Development Team<br>
        Merchant Code: 53897</p>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testEmail() {
    console.log('📧 Testing email configuration...');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'BPay Email Test',
      text: 'HMailPlus Core is working correctly!'
    };

    console.log('📧 Mail options:', mailOptions);

    try {
      // Test connection first
      console.log('🔍 Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      
      console.log('📤 Sending test email...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message, details: error };
    }
  }
}

module.exports = new EmailService();