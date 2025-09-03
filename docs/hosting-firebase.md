# Firebase Hosting + Functions Deployment Guide

This comprehensive guide will walk you through deploying the BlueRock Asset Management platform to Firebase Hosting (frontend) and Firebase Functions (backend) with complete setup instructions.

## 📋 Prerequisites

- Google account
- Node.js 18+ installed
- Firebase CLI installed
- Basic command line knowledge
- Domain name (optional, can use Firebase subdomain)

## 🔧 Step 1: Firebase CLI Setup

### 1.1 Install Firebase CLI
```bash
# Install globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### 1.2 Login to Firebase
```bash
# Login to your Google account
firebase login

# This will open a browser window
# Sign in with your Google account
# Grant necessary permissions
```

### 1.3 Verify Login
```bash
# Check logged in user
firebase projects:list
```

## 🚀 Step 2: Create Firebase Project

### 2.1 Create Project via Console
1. **Go to Firebase Console**
   - Visit https://console.firebase.google.com
   - Click "Create a project"

2. **Project Configuration**
   ```
   Project name: bluerock-asset-management
   Project ID: bluerock-asset-mgmt-2025
   Analytics: Enable (recommended)
   ```

3. **Wait for Project Creation**
   - This takes 1-2 minutes
   - Click "Continue" when ready

### 2.2 Initialize Firebase in Your Project
```bash
# Navigate to your project root
cd /path/to/bluerock-platform

# Initialize Firebase
firebase init

# Select services:
# ◉ Hosting: Configure files for Firebase Hosting
# ◉ Functions: Configure a Cloud Functions directory
# ◉ Firestore: Configure security rules and indexes files
```

### 2.3 Configuration Prompts
```bash
# Project selection
? Please select an option: Use an existing project
? Select a default Firebase project: bluerock-asset-mgmt-2025

# Functions setup
? What language would you like to use? TypeScript
? Do you want to use ESLint? Yes
? Do you want to install dependencies now? Yes

# Hosting setup
? What do you want to use as your public directory? frontend/out
? Configure as a single-page app? Yes
? Set up automatic builds and deploys with GitHub? No
```

## 🗄️ Step 3: Database Setup (Firestore)

### 3.1 Enable Firestore
1. **Go to Firebase Console**
   - Select your project
   - Click "Firestore Database"
   - Click "Create database"

2. **Security Rules**
   - Start in "Test mode" for development
   - Choose location closest to your users

### 3.2 Configure Firestore Rules
Update `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Public read-only data
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3.3 Create Firestore Indexes
Update `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "investments",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

## ⚙️ Step 4: Backend Setup (Firebase Functions)

### 4.1 Prepare Functions Directory
```bash
# Navigate to functions directory
cd functions

# Install additional dependencies
npm install express cors helmet bcryptjs jsonwebtoken
npm install nodemailer mjml moment uuid joi
npm install @types/express @types/cors @types/bcryptjs
npm install @types/jsonwebtoken @types/nodemailer @types/uuid
```

### 4.2 Update Functions Package.json
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.8.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "nodemailer": "^6.9.7",
    "mjml": "^4.14.1",
    "moment": "^2.29.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.0"
  }
}
```

### 4.3 Create Main Functions File
Update `functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Initialize Firebase Admin
admin.initializeApp();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import investmentRoutes from './routes/investment';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/investment', investmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BlueRock API'
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Scheduled function for weekly payouts (every Friday at 12:00 PM UTC)
export const weeklyPayouts = functions.pubsub
  .schedule('0 12 * * 5')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Processing weekly payouts...');
    
    const db = admin.firestore();
    const today = new Date();
    
    // Get scheduled payouts for today
    const payoutsSnapshot = await db.collection('payouts')
      .where('status', '==', 'scheduled')
      .where('scheduledDate', '<=', today)
      .get();
    
    const batch = db.batch();
    
    payoutsSnapshot.forEach((doc) => {
      const payout = doc.data();
      
      // Update payout status
      batch.update(doc.ref, {
        status: 'completed',
        paidDate: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update user balance
      const userRef = db.collection('users').doc(payout.userId);
      batch.update(userRef, {
        balance: admin.firestore.FieldValue.increment(payout.amount),
        totalEarnings: admin.firestore.FieldValue.increment(payout.amount),
      });
      
      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      batch.set(transactionRef, {
        userId: payout.userId,
        type: 'payout',
        amount: payout.amount,
        description: `Weekly payout - Week ${payout.weekNumber}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    console.log(`Processed ${payoutsSnapshot.size} payouts`);
    
    return null;
  });

// Cleanup expired PINs (runs every hour)
export const cleanupExpiredPins = functions.pubsub
  .schedule('0 * * * *')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    
    const expiredPinsSnapshot = await db.collection('withdrawalPins')
      .where('expiresAt', '<', now)
      .where('isUsed', '==', false)
      .get();
    
    const batch = db.batch();
    
    expiredPinsSnapshot.forEach((doc) => {
      batch.update(doc.ref, { isUsed: true });
    });
    
    await batch.commit();
    console.log(`Cleaned up ${expiredPinsSnapshot.size} expired PINs`);
    
    return null;
  });
```

### 4.4 Create Authentication Routes
Create `functions/src/routes/auth.ts`:
```typescript
import { Router } from 'express';
import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = Router();
const db = admin.firestore();

// User Registration
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, country } = req.body;

    // Check if user exists
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userRef = db.collection('users').doc();
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || '',
      country: country || '',
      balance: 0,
      totalInvested: 0,
      totalEarnings: 0,
      isActive: true,
      isVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData);

    // Generate JWT
    const token = jwt.sign(
      { userId: userRef.id, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userRef.id,
          email,
          firstName,
          lastName,
          balance: 0,
          totalInvested: 0,
          totalEarnings: 0,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.isActive) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await userDoc.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: userDoc.id, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          balance: userData.balance,
          totalInvested: userData.totalInvested,
          totalEarnings: userData.totalEarnings,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

## 🌐 Step 5: Frontend Configuration

### 5.1 Update Frontend Build Configuration
Update `frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5.2 Update Frontend Package.json
Add export script to `frontend/package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "build:export": "next build && next export",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 5.3 Create Firebase Configuration
Create `frontend/lib/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

## 🔧 Step 6: Environment Configuration

### 6.1 Frontend Environment Variables
Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://us-central1-bluerock-asset-mgmt-2025.cloudfunctions.net/api
NEXT_PUBLIC_SITE_URL=https://bluerock-asset-mgmt-2025.web.app
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bluerock-asset-mgmt-2025.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bluerock-asset-mgmt-2025
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bluerock-asset-mgmt-2025.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 6.2 Functions Environment Variables
```bash
# Set environment variables for functions
firebase functions:config:set jwt.secret="your-super-secret-jwt-key"
firebase functions:config:set zoho.email="bluerockasset@zohomail.com"
firebase functions:config:set zoho.password="your-zoho-app-password"
firebase functions:config:set crypto.btc_wallet="bc1q9jatk24hcxvcqwxa9t66tkqef7mj2gkqdvqzjd"
firebase functions:config:set crypto.eth_wallet="0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3"
firebase functions:config:set crypto.usdt_trc20_wallet="TYEMJvWSj5E2d8zRnaoW9FdcRWYWbpfosG"
```

### 6.3 Access Environment Variables in Functions
Update functions to access config:
```typescript
import * as functions from 'firebase-functions';

const config = functions.config();
const jwtSecret = config.jwt.secret;
const zohoEmail = config.zoho.email;
const zohoPassword = config.zoho.password;
```

## 🚀 Step 7: Build and Deploy

### 7.1 Build Frontend
```bash
cd frontend
npm run build:export
```

### 7.2 Build Functions
```bash
cd functions
npm run build
```

### 7.3 Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 7.4 Verify Deployment
```bash
# Check hosting URL
firebase hosting:channel:list

# Check functions
firebase functions:list

# Test API endpoint
curl https://us-central1-your-project.cloudfunctions.net/api/health
```

## 🌐 Step 8: Custom Domain Setup (Optional)

### 8.1 Add Custom Domain to Hosting
```bash
# Add domain
firebase hosting:channel:create live
firebase hosting:channel:deploy live --only hosting

# Connect custom domain
# Go to Firebase Console > Hosting > Add custom domain
```

### 8.2 DNS Configuration
Add these DNS records to your domain:
```
Type: A
Name: @
Value: 151.101.1.195

Type: A  
Name: @
Value: 151.101.65.195

Type: CNAME
Name: www
Value: bluerock-asset-mgmt-2025.web.app
```

### 8.3 SSL Certificate
- Firebase automatically provisions SSL certificates
- Wait 24-48 hours for full propagation
- Certificate auto-renews

## 📧 Step 9: Email Configuration

### 9.1 Zoho Mail Setup
1. **Create Zoho Mail Account**
   - Sign up at https://www.zoho.com/mail/
   - Create account for `bluerockasset@yourdomain.com`

2. **Generate App Password**
   - Go to Zoho Mail Settings
   - Security → App Passwords
   - Generate password for "BlueRock Platform"

3. **Update Functions Configuration**
```bash
firebase functions:config:set zoho.email="bluerockasset@yourdomain.com"
firebase functions:config:set zoho.password="generated-app-password"
```

### 9.2 Email Templates in Functions
Create `functions/src/utils/email.ts`:
```typescript
import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import * as functions from 'firebase-functions';

const config = functions.config();

const transporter = nodemailer.createTransporter({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: config.zoho.email,
    pass: config.zoho.password,
  },
});

export const sendWelcomeEmail = async (to: string, firstName: string) => {
  const mjmlTemplate = `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="20px" color="#0066CC">
              Welcome to BlueRock Asset Management
            </mj-text>
            <mj-text>
              Dear ${firstName},
              
              Welcome to BlueRock Asset Management! Your account has been successfully created.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  const { html } = mjml2html(mjmlTemplate);

  await transporter.sendMail({
    from: `"BlueRock Asset Management" <${config.zoho.email}>`,
    to,
    subject: 'Welcome to BlueRock Asset Management',
    html,
  });
};
```

## 📊 Step 10: Monitoring and Analytics

### 10.1 Enable Firebase Analytics
```bash
# Analytics is automatically enabled if selected during project creation
# View analytics in Firebase Console > Analytics
```

### 10.2 Performance Monitoring
Add to `frontend/pages/_app.tsx`:
```typescript
import { getPerformance } from 'firebase/performance';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const perf = getPerformance();
      // Performance monitoring is now active
    }
  }, []);

  return <Component {...pageProps} />;
}
```

### 10.3 Error Reporting
Install Crashlytics:
```bash
npm install firebase
```

Add to your app:
```typescript
import { getCrashlytics } from 'firebase/crashlytics';

const crashlytics = getCrashlytics();
crashlytics.log('App started');
```

## 🔒 Step 11: Security Configuration

### 11.1 Firebase Security Rules
Update `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // User-specific data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        resource.data.role == 'admin';
    }
  }
}
```

### 11.2 Functions Security
Add authentication middleware:
```typescript
import jwt from 'jsonwebtoken';
import * as functions from 'firebase-functions';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, functions.config().jwt.secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

## 🔄 Step 12: Automated Deployments

### 12.1 GitHub Actions Setup
Create `.github/workflows/firebase-deploy.yml`:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../functions && npm ci
          
      - name: Build frontend
        run: cd frontend && npm run build:export
        
      - name: Build functions
        run: cd functions && npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: bluerock-asset-mgmt-2025
```

### 12.2 Setup Service Account
1. **Go to Firebase Console**
   - Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

2. **Add to GitHub Secrets**
   - Go to GitHub repository settings
   - Secrets and variables → Actions
   - Add `FIREBASE_SERVICE_ACCOUNT` with JSON content

## ✅ Step 13: Testing and Verification

### 13.1 Local Testing
```bash
# Start Firebase emulators
firebase emulators:start

# Test functions locally
curl http://localhost:5001/bluerock-asset-mgmt-2025/us-central1/api/health

# Test frontend locally
cd frontend && npm run dev
```

### 13.2 Production Testing
```bash
# Test deployed API
curl https://us-central1-bluerock-asset-mgmt-2025.cloudfunctions.net/api/health

# Test frontend
curl https://bluerock-asset-mgmt-2025.web.app
```

### 13.3 End-to-End Testing
1. **User Registration**: Create test account
2. **Email Delivery**: Verify welcome email
3. **Investment Flow**: Test deposit and investment
4. **Admin Functions**: Test admin dashboard
5. **Scheduled Functions**: Verify cron jobs work

## 🚨 Troubleshooting

### Common Issues

#### 1. Functions Deployment Fails
```bash
# Check function logs
firebase functions:log

# Common solutions:
# - Increase timeout in firebase.json
# - Check Node.js version compatibility
# - Verify all dependencies are installed
```

#### 2. Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Rebuild
cd frontend && npm run build:export
```

#### 3. Database Permission Errors
```bash
# Check Firestore rules
firebase firestore:rules:get

# Test rules locally
firebase emulators:start --only firestore
```

#### 4. Email Not Sending
```bash
# Check functions configuration
firebase functions:config:get

# Verify Zoho credentials
# Test SMTP connection manually
```

### Getting Help

1. **Firebase Documentation**: https://firebase.google.com/docs
2. **Firebase Support**: Available for paid plans
3. **Stack Overflow**: Tag questions with `firebase`
4. **Firebase Community**: https://firebase.community

## 💰 Cost Estimation

### Firebase Pricing (Monthly)
- **Hosting**: Free (1GB storage, 10GB transfer)
- **Functions**: Free (2M invocations, 400K GB-seconds)
- **Firestore**: Free (1GB storage, 50K reads, 20K writes)
- **Authentication**: Free (unlimited users)

### Paid Tier Benefits
- **Blaze Plan**: Pay-as-you-go pricing
- **Increased Limits**: Higher quotas for all services
- **Premium Support**: Email and phone support
- **Advanced Features**: Additional Firebase services

## 🎯 Performance Optimization

### 1. Functions Optimization
```typescript
// Use connection pooling for database
const db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

// Minimize cold starts
export const api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onRequest(app);
```

### 2. Frontend Optimization
```javascript
// Enable static optimization
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

### 3. Database Optimization
```typescript
// Use batch operations
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();

// Create composite indexes for complex queries
// Add to firestore.indexes.json
```

## 🔄 Backup and Recovery

### 1. Firestore Backup
```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backup-folder

# Import Firestore data
gcloud firestore import gs://your-bucket/backup-folder
```

### 2. Functions Backup
- Functions code is backed up in your Git repository
- Configuration is stored in Firebase project
- Use `firebase functions:config:get` to export config

### 3. Hosting Backup
- Static files are backed up in your Git repository
- Deployment history available in Firebase Console

## 🎯 Next Steps

1. **Monitor Performance**: Set up alerts and monitoring
2. **Scale Resources**: Upgrade to Blaze plan when needed
3. **Add Features**: Implement additional functionality
4. **Security Audit**: Regular security reviews
5. **User Feedback**: Collect and implement user feedback

---

**Congratulations!** Your BlueRock Asset Management platform is now live on Firebase with enterprise-grade performance, security, and scalability. The platform is ready for production use with automatic scaling and comprehensive monitoring.