const emailService = require('./email');
const crypto = require('crypto');

class EmailVerificationService {
  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send registration verification email
  async sendRegistrationVerification(email, fullName, token) {
    const verificationUrl = `${process.env.BASE_URL || 'https://bpayapp.co.ke'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your BPay Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Welcome to BPay!</h2>
          
          <p>Hi ${fullName},</p>
          
          <p>Thank you for registering with BPay - your trusted crypto-to-cash trading platform.</p>
          
          <p>To complete your registration and start trading, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #64748b;">${verificationUrl}</p>
          
          <p><strong>What you can do after verification:</strong></p>
          <ul>
            <li>Buy and sell cryptocurrency</li>
            <li>Instant M-Pesa deposits (Kenya users)</li>
            <li>Secure crypto trading with admin support</li>
            <li>Real-time chat with our team</li>
          </ul>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>If you didn't create this account, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            BPay Team<br>
            <a href="https://bpayapp.co.ke">bpayapp.co.ke</a>
          </p>
        </div>
      `
    };

    try {
      const result = await emailService.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send login verification email
  async sendLoginVerification(email, fullName, ipAddress, userAgent) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'New Login to Your BPay Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">New Login Detected</h2>
          
          <p>Hi ${fullName},</p>
          
          <p>We detected a new login to your BPay account:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
            <p><strong>Device:</strong> ${userAgent || 'Unknown'}</p>
          </div>
          
          <p>If this was you, no action is needed.</p>
          
          <p><strong>If this wasn't you:</strong></p>
          <ul>
            <li>Change your password immediately</li>
            <li>Contact our support team</li>
            <li>Review your account activity</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bpayapp.co.ke/reset-password" 
               style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Change Password
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            BPay Security Team<br>
            <a href="https://bpayapp.co.ke">bpayapp.co.ke</a>
          </p>
        </div>
      `
    };

    try {
      const result = await emailService.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordReset(email, fullName, resetToken) {
    const resetUrl = `${process.env.BASE_URL || 'https://bpayapp.co.ke'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your BPay Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Password Reset Request</h2>
          
          <p>Hi ${fullName},</p>
          
          <p>You requested to reset your BPay account password.</p>
          
          <p>Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
          
          <p>This reset link will expire in 1 hour.</p>
          
          <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            BPay Security Team<br>
            <a href="https://bpayapp.co.ke">bpayapp.co.ke</a>
          </p>
        </div>
      `
    };

    try {
      const result = await emailService.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailVerificationService();