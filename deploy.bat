@echo off
echo Building Flutter web app...
cd C:\Users\USER\bpay_app\flutter_app
C:\Users\USER\flutter\bin\flutter.bat build web --release
echo Deploying to Netlify...
netlify deploy --dir=build/web --prod --site=f58f7576-b470-40c2-b87c-454ea0af655f
echo Done!
