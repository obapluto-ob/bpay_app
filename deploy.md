# BPay Deployment Steps - Mobile First Strategy

## 1. Deploy Mobile App to Vercel (Primary)

1. **Go to vercel.com** → Sign in with GitHub

2. **Import Project:**
   - Click "New Project"
   - Find `obapluto-ob/bpay_app`
   - Click "Import"

3. **Configure Mobile App:**
   - Framework Preset: **Other**
   - Root Directory: **mobile**
   - Build Command: `expo export:web`
   - Output Directory: `web-build`
   - Install Command: `npm install`

4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://bpay-backend.onrender.com/api`

5. **Deploy** → Get URL like `https://bpay-mobile.vercel.app`

## 2. Deploy Backend to Render

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

2. **Create Render Account:** https://render.com
3. **Create PostgreSQL Database:**
   - Name: `bpay-db`
   - Plan: Free
   - Copy connection string

4. **Create Web Service:**
   - Connect GitHub repo
   - Name: `bpay-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     ```
     DATABASE_URL=<your-postgres-connection-string>
     JWT_SECRET=your-super-secret-key-here-make-it-long
     NODE_ENV=production
     FRONTEND_URL=https://bpay-app.vercel.app
     ```

5. **Run Migration:**
   - After first deploy, go to Render shell
   - Run: `npm run migrate`

## 2. Deploy Frontend to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
cd frontend
vercel --prod
```

3. **Set Environment Variables in Vercel Dashboard:**
   - `NEXT_PUBLIC_API_URL`: `https://bpay-backend.onrender.com/api`

## 3. Update Backend CORS

After getting Vercel URL, update backend .env:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 4. Test Deployment

- Backend: `https://bpay-backend.onrender.com/health`
- Frontend: `https://your-vercel-app.vercel.app`

## 3. Deploy Web Frontend Later (Optional)

After mobile is live, you can deploy the web frontend to:
- **Netlify** (free alternative to Vercel)
- **GitHub Pages** (completely free)
- **Firebase Hosting** (Google's free hosting)
- **Surge.sh** (simple static hosting)

```bash
# For Netlify
cd frontend
npm run build
# Upload 'out' folder to Netlify

# For GitHub Pages
cd frontend
npm run build
# Push to gh-pages branch
```

## Strategy Benefits:
✅ Mobile-first approach (most users)
✅ Single Vercel deployment for mobile
✅ Web frontend can be deployed anywhere
✅ Cost-effective scaling

## Issues Fixed:
✅ Database schema matches auth routes
✅ Migration script created
✅ Build commands added
✅ Environment variables configured
✅ Mobile app ready for Vercel web deployment