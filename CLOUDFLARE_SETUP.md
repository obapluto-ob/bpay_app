# Cloudflare Turnstile Setup Guide

## Step 1: Get Your Cloudflare Turnstile Keys

1. Go to https://dash.cloudflare.com/
2. Login with your Cloudflare account
3. Click on "Turnstile" in the left sidebar
4. Click "Add Site"
5. Fill in:
   - **Site name**: BPay Mobile App
   - **Domain**: bpayapp.co.ke (or your domain)
   - **Widget Mode**: Managed
6. Click "Create"
7. You'll get two keys:
   - **Site Key** (public): `0x4AAAAAAAzLr3LwFRj_PQVZ` (already in code)
   - **Secret Key** (private): Copy this to your .env file

## Step 2: Update Backend .env File

Open `backend/.env` and replace:
```
CLOUDFLARE_SECRET_KEY=your-cloudflare-secret-key-here
```

With your actual secret key from Cloudflare dashboard:
```
CLOUDFLARE_SECRET_KEY=0x4AAAAAAAzLr3LwFRj_PQVZ_your_actual_secret
```

## Step 3: Install Mobile Dependencies

```bash
cd mobile
npm install react-native-webview react-native-paper @react-navigation/native @react-navigation/stack
```

## Step 4: Test Registration

1. Start backend: `cd backend && npm start`
2. Start mobile: `cd mobile && npm start`
3. Try registering - you should see Cloudflare verification widget
4. Complete the verification before submitting

## What Changed

### Backend (auth-fixed.js)
- ✅ Specific error messages for each validation failure
- ✅ Cloudflare Turnstile verification
- ✅ Better duplicate email detection
- ✅ Clear error messages like:
  - "This email is already registered. Please login instead."
  - "Please enter both first and last name"
  - "Password must be at least 6 characters"
  - "Security verification failed. Please try again."

### Mobile (RegisterScreen.tsx)
- ✅ Cloudflare Turnstile widget embedded
- ✅ Detailed validation with ❌ icons
- ✅ Step-by-step error messages:
  - "❌ Please enter your first name"
  - "❌ Please enter your last name"
  - "❌ This email is already registered. Please login instead."
  - "❌ Password must be at least 6 characters"
  - "❌ Passwords do not match"
- ✅ Register button disabled until Cloudflare verification completes

## Error Messages Users Will See

| Issue | Error Message |
|-------|---------------|
| Missing first name | ❌ Please enter your first name |
| Missing last name | ❌ Please enter your last name |
| Invalid email | ❌ Please enter a valid email address |
| Email exists | ❌ This email is already registered. Please login instead. |
| Short password | ❌ Password must be at least 6 characters |
| Password mismatch | ❌ Passwords do not match |
| Cloudflare failed | ❌ Security verification failed. Please try again. |
| Network error | ❌ Network error. Please check your connection and try again. |

## Security Benefits

1. **Bot Protection**: Cloudflare Turnstile blocks automated registrations
2. **No CAPTCHA**: User-friendly verification (no clicking traffic lights)
3. **Free Tier**: 1 million verifications/month free
4. **Privacy-First**: No tracking or data collection
5. **Fast**: Invisible verification for most users

## Troubleshooting

### Cloudflare widget not showing
- Check internet connection
- Verify site key is correct in RegisterScreen.tsx
- Check Cloudflare dashboard for domain restrictions

### "Security verification failed" error
- Verify secret key in backend/.env matches Cloudflare dashboard
- Check backend logs for Cloudflare API errors
- Ensure backend can reach challenges.cloudflare.com

### Registration still fails with good data
- Check backend logs for specific error
- Verify database connection
- Test `/api/auth/check-email` endpoint manually
