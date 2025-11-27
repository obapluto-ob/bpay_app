import { EmailService } from './EmailService';

export class NotificationService {
  private emailService = new EmailService();

  async notifyTradeCreated(userEmail: string, tradeId: string, amount: number, currency: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Trade Created Successfully</h2>
        <p>Your trade has been created and is pending verification.</p>
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Trade ID:</strong> ${tradeId}</p>
          <p><strong>Amount:</strong> ${amount} ${currency}</p>
          <p><strong>Status:</strong> Pending Payment Verification</p>
        </div>
        <p>Please upload your payment proof to complete the transaction.</p>
      </div>
    `;

    await this.emailService.transporter.sendMail({
      from: `"BPay" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Trade Created - BPay',
      html
    });
  }

  async notifyAdminNewTrade(tradeId: string, userEmail: string, amount: number, currency: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New Trade Requires Verification</h2>
        <div style="background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p><strong>Trade ID:</strong> ${tradeId}</p>
          <p><strong>User:</strong> ${userEmail}</p>
          <p><strong>Amount:</strong> ${amount} ${currency}</p>
          <p><strong>Status:</strong> Awaiting Admin Verification</p>
        </div>
        <p>Please review and verify this trade in the admin dashboard.</p>
      </div>
    `;

    await this.emailService.transporter.sendMail({
      from: `"BPay Admin Alert" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'bpaytraderslowrate@gmail.com',
      subject: `New Trade Alert - ${tradeId}`,
      html
    });
  }

  async notifyTradeApproved(userEmail: string, tradeId: string, amount: number, currency: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Trade Approved!</h2>
        <p>Great news! Your trade has been approved and completed.</p>
        <div style="background: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669;">
          <p><strong>Trade ID:</strong> ${tradeId}</p>
          <p><strong>Amount:</strong> ${amount} ${currency}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
        <p>Your wallet has been updated with the transaction.</p>
      </div>
    `;

    await this.emailService.transporter.sendMail({
      from: `"BPay" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Trade Approved - BPay',
      html
    });
  }

  async notifyTradeRejected(userEmail: string, tradeId: string, reason: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Trade Rejected</h2>
        <p>Unfortunately, your trade has been rejected.</p>
        <div style="background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p><strong>Trade ID:</strong> ${tradeId}</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please contact support if you have any questions.</p>
      </div>
    `;

    await this.emailService.transporter.sendMail({
      from: `"BPay" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Trade Rejected - BPay',
      html
    });
  }
}