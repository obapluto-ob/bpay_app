# BPay Free Upgrades Implementation Guide

## Overview
This guide covers three major free upgrades for BPay:
1. **Voice Chat** - Real-time voice communication during trades
2. **Multi-Language Support** - Support for multiple languages
3. **Browser-Based KYC** - OCR document verification without external APIs

---

## 1. Voice Chat with Daily.co (FREE)

### Why Daily.co?
- **Free Tier**: 10 rooms, unlimited minutes
- **No credit card required**
- **WebRTC-based** (high quality)
- **Simple API**

### Implementation Steps

#### Step 1: Sign up for Daily.co
```bash
# Visit https://www.daily.co/
# Sign up for free account
# Get your API key from dashboard
```

#### Step 2: Install Daily.co SDK
```bash
cd frontend
npm install @daily-co/daily-js
```

#### Step 3: Create Voice Chat Component
```typescript
// frontend/src/components/VoiceChat.tsx
import DailyIframe from '@daily-co/daily-js';
import { useEffect, useState } from 'react';

export default function VoiceChat({ tradeId, onClose }: any) {
  const [callFrame, setCallFrame] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const frame = DailyIframe.createFrame({
      showLeaveButton: true,
      iframeStyle: {
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 9999
      }
    });

    frame.join({ url: `https://bpay.daily.co/trade-${tradeId}` });
    
    frame.on('joined-meeting', () => setJoined(true));
    frame.on('left-meeting', () => {
      frame.destroy();
      onClose();
    });

    setCallFrame(frame);

    return () => {
      if (frame) frame.destroy();
    };
  }, [tradeId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50">
      <button
        onClick={() => {
          if (callFrame) callFrame.leave();
        }}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-[10000]"
      >
        End Call
      </button>
    </div>
  );
}
```

#### Step 4: Add Voice Button to Trade Chat
```typescript
// In trade-chat.tsx, add button:
<button
  onClick={() => setShowVoiceChat(true)}
  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
>
  Voice Call
</button>

{showVoiceChat && (
  <VoiceChat 
    tradeId={tradeId} 
    onClose={() => setShowVoiceChat(false)} 
  />
)}
```

#### Step 5: Backend Room Creation (Optional)
```javascript
// backend/routes/voice.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/create-room', async (req, res) => {
  try {
    const { tradeId } = req.body;
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: `trade-${tradeId}`,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_chat: false,
          enable_screenshare: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ url: response.data.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

module.exports = router;
```

---

## 2. Multi-Language Support with i18next (FREE)

### Why i18next?
- **100% Free**
- **Browser-based** (no API calls)
- **Lightweight**
- **Easy to use**

### Implementation Steps

#### Step 1: Install i18next
```bash
cd frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

#### Step 2: Create Translation Files
```javascript
// frontend/src/i18n/translations.ts
export const translations = {
  en: {
    translation: {
      welcome: "Welcome to BPay",
      buy: "Buy",
      sell: "Sell",
      balance: "Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      profile: "Profile",
      logout: "Logout",
      // Add more translations
    }
  },
  fr: {
    translation: {
      welcome: "Bienvenue sur BPay",
      buy: "Acheter",
      sell: "Vendre",
      balance: "Solde",
      deposit: "Dépôt",
      withdraw: "Retrait",
      profile: "Profil",
      logout: "Déconnexion",
    }
  },
  es: {
    translation: {
      welcome: "Bienvenido a BPay",
      buy: "Comprar",
      sell: "Vender",
      balance: "Saldo",
      deposit: "Depositar",
      withdraw: "Retirar",
      profile: "Perfil",
      logout: "Cerrar sesión",
    }
  },
  sw: {
    translation: {
      welcome: "Karibu BPay",
      buy: "Nunua",
      sell: "Uza",
      balance: "Salio",
      deposit: "Weka",
      withdraw: "Toa",
      profile: "Wasifu",
      logout: "Toka",
    }
  }
};
```

#### Step 3: Initialize i18next
```typescript
// frontend/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './translations';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: translations,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### Step 4: Use in Components
```typescript
// In any component:
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('fr')}>
        Français
      </button>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('sw')}>
        Kiswahili
      </button>
    </div>
  );
}
```

#### Step 5: Add Language Selector
```typescript
// frontend/src/components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' }
  ];

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="p-2 border rounded-lg"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 3. Browser-Based KYC with Tesseract.js (FREE)

### Why Tesseract.js?
- **100% Free**
- **No API calls** (runs in browser)
- **OCR for ID documents**
- **Works offline**

### Implementation Steps

#### Step 1: Install Tesseract.js
```bash
cd frontend
npm install tesseract.js face-api.js
```

#### Step 2: Create KYC Component
```typescript
// frontend/src/components/BrowserKYC.tsx
import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function BrowserKYC({ onComplete }: any) {
  const [idImage, setIdImage] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const extractTextFromID = async (imageFile: File) => {
    setLoading(true);
    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => console.log(m)
        }
      );

      const text = result.data.text;
      
      // Extract common ID fields
      const nameMatch = text.match(/Name[:\\s]+([A-Z\\s]+)/i);
      const dobMatch = text.match(/Date of Birth[:\\s]+(\\d{2}[/-]\\d{2}[/-]\\d{4})/i);
      const idMatch = text.match(/ID[:\\s]+([A-Z0-9]+)/i);

      setExtractedData({
        fullName: nameMatch ? nameMatch[1].trim() : '',
        dateOfBirth: dobMatch ? dobMatch[1] : '',
        idNumber: idMatch ? idMatch[1] : '',
        rawText: text
      });

      setLoading(false);
    } catch (error) {
      console.error('OCR Error:', error);
      setLoading(false);
      alert('Failed to extract text. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setIdImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      extractTextFromID(file);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-bold">Browser-Based KYC</h3>
      
      {!idImage ? (
        <label className="block bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer">
          <span className="text-blue-600 font-semibold">Upload ID Document</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <img src={idImage} alt="ID" className="w-full rounded-lg" />
          
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-slate-600">Extracting text from ID...</p>
            </div>
          ) : extractedData ? (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">Extracted Information:</h4>
              <div className="space-y-2">
                <p><strong>Name:</strong> {extractedData.fullName || 'Not found'}</p>
                <p><strong>Date of Birth:</strong> {extractedData.dateOfBirth || 'Not found'}</p>
                <p><strong>ID Number:</strong> {extractedData.idNumber || 'Not found'}</p>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onComplete(extractedData)}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold"
                >
                  Confirm & Submit
                </button>
                <button
                  onClick={() => {
                    setIdImage('');
                    setExtractedData(null);
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
```

#### Step 3: Add Face Verification (Optional)
```typescript
// frontend/src/components/FaceVerification.tsx
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceVerification({ idPhoto, onComplete }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    setModelsLoaded(true);
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
  };

  const detectFace = async () => {
    if (videoRef.current && modelsLoaded) {
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        // Compare with ID photo
        const idDetection = await faceapi.detectSingleFace(idPhoto)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (idDetection) {
          const distance = faceapi.euclideanDistance(
            detection.descriptor,
            idDetection.descriptor
          );

          if (distance < 0.6) {
            alert('Face verified successfully!');
            onComplete(true);
          } else {
            alert('Face does not match ID photo');
          }
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-bold">Face Verification</h3>
      
      {!modelsLoaded ? (
        <p>Loading face detection models...</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full rounded-lg"
          />
          
          <button
            onClick={startVideo}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold"
          >
            Start Camera
          </button>
          
          <button
            onClick={detectFace}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold"
          >
            Verify Face
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Cost Comparison

### Voice Chat
- **Daily.co Free**: 10 rooms, unlimited minutes - **$0/month**
- **Twilio**: ~$0.004/minute = **$240/month** for 1000 hours
- **Agora**: ~$0.99/1000 minutes = **$59/month** for 1000 hours

### Multi-Language
- **i18next (Browser)**: **$0/month**
- **Google Translate API**: $20 per 1M characters = **~$100/month**
- **AWS Translate**: $15 per 1M characters = **~$75/month**

### KYC Verification
- **Tesseract.js (Browser)**: **$0/month**
- **AWS Textract**: $1.50 per 1000 pages = **~$150/month**
- **Google Vision API**: $1.50 per 1000 images = **~$150/month**

### Total Savings
- **Free Solution**: **$0/month**
- **Paid APIs**: **~$500-800/month**
- **Annual Savings**: **$6,000-9,600**

---

## Implementation Priority

1. **Multi-Language** (Easiest, 2 hours)
   - Install i18next
   - Create translation files
   - Add language selector

2. **Browser KYC** (Medium, 4 hours)
   - Install Tesseract.js
   - Create OCR component
   - Test with sample IDs

3. **Voice Chat** (Advanced, 6 hours)
   - Sign up for Daily.co
   - Integrate SDK
   - Test voice quality

---

## Testing Checklist

### Voice Chat
- [ ] Room creation works
- [ ] Audio quality is good
- [ ] Call ends properly
- [ ] Works on mobile

### Multi-Language
- [ ] All languages load
- [ ] Translations are accurate
- [ ] Language persists on refresh
- [ ] RTL languages work (Arabic)

### Browser KYC
- [ ] OCR extracts text correctly
- [ ] Works with different ID types
- [ ] Face detection works
- [ ] Data saves to database

---

## Next Steps

1. Choose which upgrade to implement first
2. Follow the implementation steps
3. Test thoroughly
4. Deploy to production
5. Monitor usage and performance

---

## Support Resources

- **Daily.co Docs**: https://docs.daily.co/
- **i18next Docs**: https://www.i18next.com/
- **Tesseract.js Docs**: https://tesseract.projectnaptha.com/
- **Face-api.js Docs**: https://github.com/justadudewhohacks/face-api.js

---

**Total Implementation Time**: 12-15 hours
**Total Cost**: $0/month
**Value Added**: $500-800/month in API savings
