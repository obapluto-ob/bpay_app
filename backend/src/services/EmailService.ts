import nodemailer from 'nodemailer';
import crypto from 'crypto';

export class EmailService {
  private transporter;

  constructor() {
    // Use mock email service if no SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Using mock email service for testing');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationEmail(email: string, code: string, type: 'registration' | 'login') {
    const subject = type === 'registration' ? 'Verify Your BPay Account' : 'BPay Login Verification';
    
    // Mock email service for testing
    if (!this.transporter) {
      console.log(`📧 Mock Email Sent:`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Verification Code: ${code}`);
      console.log(`Type: ${type}`);
      console.log('---');
      return;
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">BPay ${type === 'registration' ? 'Registration' : 'Login'} Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #059669; font-size: 32px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"BPay" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html
    });
  }
}