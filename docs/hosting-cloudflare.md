# Cloudflare Pages + Workers Deployment Guide

This guide will walk you through deploying BlueRock Asset Management platform to Cloudflare Pages (frontend) and Cloudflare Workers (backend) with complete DNS setup for Zoho Mail.

## 📋 Prerequisites

- Cloudflare account (free tier works)
- Domain name (can be purchased through Cloudflare)
- GitHub account for code repository
- Basic understanding of DNS settings

## 🌐 Step 1: Domain Setup

### 1.1 Add Domain to Cloudflare
1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Click "Add a Site"

2. **Enter Your Domain**
   - Type your domain name (e.g., `bluerockasset.com`)
   - Click "Add Site"

3. **Choose Plan**
   - Select "Free" plan (sufficient for most needs)
   - Click "Continue"

4. **DNS Records Scan**
   - Cloudflare will scan existing DNS records
   - Review and import relevant records
   - Click "Continue"

5. **Change Nameservers**
   - Copy the two nameservers provided by Cloudflare
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Replace existing nameservers with Cloudflare's
   - Wait 24-48 hours for propagation

### 1.2 Verify Domain Setup
```bash
# Check nameservers (should show Cloudflare)
nslookup -type=ns yourdomain.com

# Expected output:
# yourdomain.com nameserver = alice.ns.cloudflare.com
# yourdomain.com nameserver = bob.ns.cloudflare.com
```

## 📧 Step 2: Zoho Mail DNS Configuration

### 2.1 Add MX Records
In Cloudflare DNS settings, add these MX records:

| Type | Name | Content | Priority | TTL |
|------|------|---------|----------|-----|
| MX | @ | mx.zoho.com | 10 | Auto |
| MX | @ | mx2.zoho.com | 20 | Auto |
| MX | @ | mx3.zoho.com | 50 | Auto |

### 2.2 Add CNAME Records
| Type | Name | Content | TTL |
|------|------|---------|-----|
| CNAME | mail | business.zoho.com | Auto |
| CNAME | imap | imappro.zoho.com | Auto |
| CNAME | smtp | smtppro.zoho.com | Auto |
| CNAME | pop | poppro.zoho.com | Auto |

### 2.3 Add TXT Records for Verification
| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | @ | zoho-verification=zb12345678.zmverify.zoho.com | Auto |
| TXT | @ | v=spf1 include:zoho.com ~all | Auto |

### 2.4 Add DKIM Record
1. **Get DKIM from Zoho**
   - Login to Zoho Mail Admin
   - Go to Email Authentication → DKIM
   - Copy the DKIM record

2. **Add to Cloudflare**
   | Type | Name | Content | TTL |
   |------|------|---------|-----|
   | TXT | 1234567890._domainkey | v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3... | Auto |

### 2.5 Add DMARC Record
| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com | Auto |

## 🚀 Step 3: Frontend Deployment (Cloudflare Pages)

### 3.1 Prepare Repository
1. **Push Code to GitHub**
```bash
git add .
git commit -m "Initial BlueRock platform commit"
git push origin main
```

2. **Build Configuration**
Create `frontend/package.json` build script:
```json
{
  "scripts": {
    "build": "next build && next export"
  }
}
```

### 3.2 Deploy to Cloudflare Pages
1. **Go to Cloudflare Pages**
   - In Cloudflare dashboard, click "Pages"
   - Click "Create a project"

2. **Connect GitHub**
   - Click "Connect to Git"
   - Authorize Cloudflare to access GitHub
   - Select your repository

3. **Configure Build Settings**
   ```
   Framework preset: Next.js
   Build command: cd frontend && npm run build
   Build output directory: frontend/out
   Root directory: /
   ```

4. **Environment Variables**
   Add these environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete (5-10 minutes)

### 3.3 Custom Domain Setup
1. **Add Custom Domain**
   - In Pages project, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain: `yourdomain.com`

2. **DNS Configuration**
   Cloudflare will automatically add:
   ```
   Type: CNAME
   Name: yourdomain.com
   Content: your-project.pages.dev
   ```

3. **SSL Certificate**
   - SSL certificate will be automatically provisioned
   - Wait 10-15 minutes for activation

## ⚙️ Step 4: Backend Deployment (Cloudflare Workers)

### 4.1 Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 4.2 Configure Worker
Create `backend/wrangler.toml`:
```toml
name = "bluerock-api"
main = "src/worker.js"
compatibility_date = "2024-01-15"

[env.production]
name = "bluerock-api-prod"

[[env.production.routes]]
pattern = "api.yourdomain.com/*"

[vars]
NODE_ENV = "production"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### 4.3 Adapt Express App for Workers
Create `backend/src/worker.js`:
```javascript
import { Router } from 'itty-router';
import app from './index.js';

const router = Router();

// Handle all API routes
router.all('/api/*', async (request, env, ctx) => {
  // Convert Worker request to Express-compatible request
  const expressReq = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    body: await request.text(),
  };

  // Process through Express app
  const response = await app(expressReq);
  
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};
```

### 4.4 Database Configuration
1. **Use Cloudflare D1 (SQLite)**
```bash
wrangler d1 create bluerock-db
```

2. **Update wrangler.toml**
```toml
[[d1_databases]]
binding = "DB"
database_name = "bluerock-db"
database_id = "your-database-id"
```

3. **Run Migrations**
```bash
wrangler d1 execute bluerock-db --file=./prisma/migrations/init.sql
```

### 4.5 Environment Variables
```bash
wrangler secret put JWT_SECRET
wrangler secret put ZOHO_EMAIL
wrangler secret put ZOHO_APP_PASSWORD
```

### 4.6 Deploy Worker
```bash
cd backend
wrangler deploy
```

## 🔧 Step 5: DNS Configuration for API

### 5.1 Add API Subdomain
In Cloudflare DNS:
| Type | Name | Content | TTL |
|------|------|---------|-----|
| CNAME | api | your-worker.your-subdomain.workers.dev | Auto |

### 5.2 Update Frontend Configuration
Update frontend environment variables:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 📊 Step 6: Monitoring and Analytics

### 6.1 Enable Analytics
1. **Cloudflare Analytics**
   - Go to Analytics tab in dashboard
   - Enable Web Analytics
   - Add tracking code to frontend

2. **Worker Analytics**
   - Monitor API performance in Workers dashboard
   - Set up alerts for errors and performance

### 6.2 Error Tracking
```javascript
// Add to worker.js
addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

## 🔒 Step 7: Security Configuration

### 7.1 SSL/TLS Settings
1. **Go to SSL/TLS tab**
2. **Set encryption mode to "Full (strict)"**
3. **Enable "Always Use HTTPS"**
4. **Enable "HTTP Strict Transport Security (HSTS)"**

### 7.2 Security Headers
Add to Pages project:
```javascript
// _headers file in frontend/public
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 7.3 Rate Limiting
```javascript
// In worker.js
const RATE_LIMIT = 100; // requests per minute
const rateLimiter = new Map();

async function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, []);
  }
  
  const requests = rateLimiter.get(ip);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

## 🔄 Step 8: Automated Deployments

### 8.1 GitHub Actions for Pages
Create `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: bluerock-frontend
          directory: frontend/out
```

### 8.2 GitHub Actions for Workers
Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## ✅ Step 9: Testing and Verification

### 9.1 DNS Propagation Check
```bash
# Check if DNS has propagated
dig yourdomain.com
dig api.yourdomain.com
dig mail.yourdomain.com
```

### 9.2 SSL Certificate Verification
```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 9.3 Email Configuration Test
1. **Send test email from Zoho**
2. **Check SPF, DKIM, DMARC records**
3. **Verify email delivery**

### 9.4 Application Testing
1. **Frontend**: Visit https://yourdomain.com
2. **API**: Test https://api.yourdomain.com/health
3. **Registration**: Create test account
4. **Investment**: Test investment flow
5. **Admin**: Test admin dashboard

## 🚨 Troubleshooting

### Common Issues

#### 1. DNS Not Propagating
```bash
# Check current nameservers
nslookup -type=ns yourdomain.com

# If not showing Cloudflare nameservers:
# - Wait longer (up to 48 hours)
# - Double-check nameserver configuration at registrar
```

#### 2. SSL Certificate Issues
- **Problem**: "Your connection is not private"
- **Solution**: 
  - Wait 15-30 minutes for certificate provisioning
  - Check SSL/TLS settings in Cloudflare
  - Ensure DNS is properly configured

#### 3. Email Not Working
- **Problem**: Emails not sending/receiving
- **Solution**:
  - Verify all DNS records are correct
  - Check Zoho Mail configuration
  - Test with online DNS checker tools

#### 4. API Not Responding
- **Problem**: Frontend can't connect to API
- **Solution**:
  - Check Worker deployment status
  - Verify environment variables
  - Check CORS configuration

#### 5. Build Failures
- **Problem**: Pages build failing
- **Solution**:
  - Check build logs in Cloudflare dashboard
  - Verify build command and output directory
  - Ensure all dependencies are installed

### Getting Help

1. **Cloudflare Community**: https://community.cloudflare.com
2. **Cloudflare Support**: Available for paid plans
3. **Documentation**: https://developers.cloudflare.com
4. **Status Page**: https://www.cloudflarestatus.com

## 📈 Performance Optimization

### 1. Caching Configuration
```javascript
// In worker.js
const cache = caches.default;
const cacheKey = new Request(url.toString(), request);

// Check cache first
let response = await cache.match(cacheKey);
if (response) {
  return response;
}

// Cache API responses
response = new Response(data, {
  headers: {
    'Cache-Control': 'public, max-age=300', // 5 minutes
  },
});
await cache.put(cacheKey, response.clone());
```

### 2. Image Optimization
- Use Cloudflare Image Resizing
- Enable WebP conversion
- Set appropriate cache headers

### 3. Minification
- Enable Auto Minify in Cloudflare
- Use build-time optimization
- Compress static assets

## 💰 Cost Estimation

### Cloudflare Costs (Monthly)
- **Pages**: Free (up to 500 builds/month)
- **Workers**: Free (up to 100,000 requests/day)
- **DNS**: Free
- **SSL**: Free
- **D1 Database**: Free (up to 5GB)

### Additional Costs
- **Domain**: $10-15/year
- **Zoho Mail**: Free (up to 5 users) or $1/user/month
- **Premium Features**: Optional paid Cloudflare features

## 🎯 Next Steps

1. **Monitor Performance**: Set up alerts and monitoring
2. **Backup Strategy**: Implement database backups
3. **Scaling**: Plan for increased traffic
4. **Security**: Regular security audits
5. **Updates**: Keep dependencies updated

---

**Congratulations!** Your BlueRock Asset Management platform is now live on Cloudflare with professional email setup. The platform is ready for production use with enterprise-grade performance and security.