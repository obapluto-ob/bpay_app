const nodemailer = require('nodemailer');

class FallbackEmailService {
  constructor() {
    // Try hMailPlus first, fallback to Gmail
    this.primaryTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 5000
    });

    // Fallback Gmail transporter
    this.fallbackTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'your-gmail@gmail.com',
        pass: process.env.GMAIL_PASS || 'your-app-password'
      }
    });
  }

  async sendMail(mailOptions) {
    try {
      // Try primary first
      const result = await this.primaryTransporter.sendMail(mailOptions);
      console.log('✅ Email sent via hMailPlus:', result.messageId);
      return { success: true, messageId: result.messageId, provider: 'hMailPlus' };
    } catch (error) {
      console.log('❌ hMailPlus failed, trying Gmail fallback:', error.message);
      
      try {
        // Fallback to Gmail
        const fallbackOptions = {
          ...mailOptions,
          from: process.env.GMAIL_USER || 'your-gmail@gmail.com'
        };
        
        const result = await this.fallbackTransporter.sendMail(fallbackOptions);
        console.log('✅ Email sent via Gmail fallback:', result.messageId);
        return { success: true, messageId: result.messageId, provider: 'Gmail' };
      } catch (fallbackError) {
        console.error('❌ Both email providers failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
  }

  async testEmail() {
    const testOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: 'BPay Email Test',
      text: 'Email service is working!'
    };

    return await this.sendMail(testOptions);
  }
}

module.exports = new FallbackEmailService();