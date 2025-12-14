# HMailPlus Core Email Setup Guide

## Step 1: Configure HMailPlus SMTP Settings

### Find Your Email Settings:
- **SMTP Server**: Usually `mail.yourdomain.com` or provided by host
- **Port**: 587 (TLS) or 465 (SSL)
- **Username**: Your full email address
- **Password**: Your email password

## Step 2: Add to Your BPay App

### Backend Email Service:
```javascript
// backend/services/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'mail.yourdomain.com', // Your SMTP server
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: 'support@yourdomain.com', // Your email
    pass: 'your-email-password'
  }
});

module.exports = { transporter };
```

### Environment Variables:
```bash
# Add to .env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=support@yourdomain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=BPay Support <support@yourdomain.com>
```

## Step 3: Test Email Sending

### Test Route:
```javascript
// backend/routes/test-email.js
router.post('/send-test', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com',
      subject: 'BPay Email Test',
      text: 'Email working!'
    });
    res.json({ success: true });
  } catch (error) {
    res.json({ error: error.message });
  }
});
```

## Step 4: Common Issues & Solutions

### If emails don't send:
1. Check SMTP settings with your host
2. Verify email password is correct
3. Enable "Less secure apps" if required
4. Check firewall/port blocking

### Get SMTP details from:
- Your hosting provider (cPanel/Plesk)
- Domain registrar email settings
- HMailPlus documentation

## Step 5: What You Need to Provide:
- Your domain name
- Email hosting provider
- Current email setup (cPanel, Plesk, etc.)