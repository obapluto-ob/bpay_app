@echo off
echo Installing WebSocket dependencies...

cd backend
echo Installing backend WebSocket dependency...
npm install ws@^8.14.2
echo Backend WebSocket dependency installed!

cd ..
echo WebSocket setup complete!
echo.
echo To test real-time chat:
echo 1. Start backend: cd backend && npm start
echo 2. Start mobile app: cd mobile && npm start
echo 3. Open multiple devices/simulators to test real-time messaging
echo.
pause