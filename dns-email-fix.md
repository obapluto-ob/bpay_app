# DNS Email Fix for bpayapp.co.ke

## Problem:
- Domain points to Netlify (web hosting)
- Email should point to Host Africa (email hosting)
- Need separate routing for web vs email

## Solution: Add These DNS Records

### 1. Keep Web Traffic to Netlify:
```
Type: A
Name: @
Value: [Netlify IP] (keep current)

Type: CNAME  
Name: www
Value: bpayapp.co.ke (keep current)
```

### 2. Add Email Records for Host Africa:
```
Type: MX
Name: @
Value: mail.bpayapp.co.ke
Priority: 10

Type: A
Name: mail
Value: [Host Africa Mail Server IP]

Type: CNAME
Name: webmail
Value: mail.bpayapp.co.ke
```

### 3. Find Host Africa Mail Server IP:
Contact Host Africa support:
- Phone: +27 11 784 4000
- Ask: "What is the mail server IP for bpayapp.co.ke?"

### 4. Alternative - Use Host Africa Nameservers:
Change your nameservers to Host Africa:
- ns1.hostafrica.co.za
- ns2.hostafrica.co.za

This will route email properly while keeping web on Netlify.