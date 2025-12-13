# BPay DNS Configuration Guide

## Required DNS Records

### Main Application
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300
```

### WWW Subdomain
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 300
```

### API Subdomain (Backend)
```
Type: CNAME
Name: api
Value: yourdomain.com
TTL: 300
```

### Admin Panel Subdomain
```
Type: CNAME
Name: admin
Value: yourdomain.com
TTL: 300
```

### WebSocket for Real-time Chat
```
Type: CNAME
Name: ws
Value: yourdomain.com
TTL: 300
```

## SSL Certificate Setup
After DNS propagation (24-48 hours), configure SSL:
- Enable HTTPS for all subdomains
- Set up automatic certificate renewal
- Configure HSTS headers

## Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket for chat
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Variables Update
Update your production environment files:

### Backend (.env)
```
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api
WEBSOCKET_URL=https://yourdomain.com
```

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=https://yourdomain.com
```