# BlueRock Asset Management Platform

A complete, production-ready investment platform for cryptocurrency asset management with guaranteed weekly returns.

## 🚀 Features

### Frontend (Next.js)
- **Responsive Design**: Mobile-first, professional UI with BlueRock branding
- **Investment Calculator**: Interactive calculator with real-time calculations
- **User Dashboard**: Complete portfolio management and transaction history
- **Authentication**: Secure JWT-based authentication system
- **Professional Animations**: Smooth, corporate-grade animations throughout
- **SEO Optimized**: Complete meta tags, structured data, and sitemap

### Backend (Node.js/Express)
- **RESTful API**: Complete API with authentication and authorization
- **Database**: PostgreSQL with Prisma ORM
- **Email System**: Professional MJML templates with Zoho Mail integration
- **Cron Jobs**: Automated weekly payouts every Friday
- **Security**: Rate limiting, input validation, and comprehensive error handling
- **Admin Panel**: Complete admin dashboard for user and transaction management

### Investment System
- **Transparent Formula**: Weekly Payout = (Investment ÷ 500) × 300
- **8-Week Duration**: Guaranteed payouts every Friday for 8 weeks
- **Crypto-Only**: Bitcoin, Ethereum, BNB, and USDT (all networks)
- **Minimum Investment**: $300 USD equivalent
- **Withdrawal System**: Secure PIN-based withdrawal process

## 🏗️ Architecture

```
bluerock-platform/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Express API server
├── database/          # Database migrations and schema
├── emails/            # Email templates (MJML)
├── content/           # Blog posts and legal documents
├── assets/            # Brand assets and images
└── docs/              # Documentation and deployment guides
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context + Local Storage

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer with MJML templates
- **Validation**: Joi and express-validator
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with structured logging
- **Jobs**: Node-cron for scheduled tasks

### Database Schema
- **Users**: Account management and authentication
- **Investments**: Investment plans and tracking
- **Transactions**: Deposits, withdrawals, and payouts
- **Admin**: Administrative users and audit logs
- **Email Logs**: Email delivery tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bluerock-platform
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend  
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your configuration
```

4. **Set up the database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Start development servers**
```bash
# From root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📧 Email Configuration

### Zoho Mail Setup
1. Create a Zoho Mail account for `bluerockasset@zohomail.com`
2. Generate an App Password in Zoho Mail settings
3. Update `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` in backend/.env

### Email Templates
Professional MJML templates included for:
- Welcome emails
- Deposit confirmations
- Investment plan activation
- Weekly payout notifications
- Withdrawal confirmations
- Password reset
- Security alerts

## 💰 Investment System

### Formula
```
Weekly Payout = (Investment ÷ 500) × 300
```

### Examples
| Investment | Weekly Payout | Total Returns | Net Profit | ROI |
|------------|---------------|---------------|------------|-----|
| $300 | $180 | $1,440 | $1,140 | 380% |
| $1,000 | $600 | $4,800 | $3,800 | 380% |
| $5,000 | $3,000 | $24,000 | $19,000 | 380% |

### Supported Cryptocurrencies
- **Bitcoin (BTC)**: `bc1q9jatk24hcxvcqwxa9t66tkqef7mj2gkqdvqzjd`
- **Ethereum (ETH)**: `0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3`
- **BNB**: `0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3`
- **USDT (ERC20)**: `0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3`
- **USDT (BEP20)**: `0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3`
- **USDT (TRC20)**: `TYEMJvWSj5E2d8zRnaoW9FdcRWYWbpfosG`

## 👤 Default Credentials

### Admin Access
- **Email**: `admin@bluerockasset.com`
- **Password**: `BlueRock2025!`
- **URL**: `/admin/login`

### Demo User (Development)
- **Email**: `demo@bluerockasset.com`
- **Password**: `demo123456`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: HTTP security headers
- **Withdrawal PINs**: Time-limited, one-use withdrawal authorization
- **Audit Logging**: Complete admin action tracking

## 📊 Admin Features

- **Dashboard**: Overview of users, investments, and transactions
- **User Management**: View and manage user accounts
- **Deposit Management**: Confirm or reject deposit requests
- **Withdrawal Management**: Generate PINs and approve withdrawals
- **Investment Tracking**: Monitor active investment plans
- **Audit Logs**: Complete activity tracking
- **Email Management**: View email delivery status
- **System Settings**: Configure platform parameters

## 🎨 Brand System

### Colors
- **Primary Blue**: #0066CC
- **Primary Blue Dark**: #004499
- **Secondary Gray**: #808080
- **Success Green**: #10B981
- **Error Red**: #EF4444

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Semibold to Bold weights
- **Body Text**: Regular to Medium weights

### Components
- Consistent button styles and hover effects
- Professional card designs with subtle shadows
- Smooth animations and transitions
- Responsive grid layouts

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: xs (475px), sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Appropriate touch targets and spacing
- **Performance**: Optimized images and lazy loading

## 🔄 Automated Systems

### Weekly Payouts
- **Schedule**: Every Friday at 12:00 PM UTC
- **Process**: Automatic calculation and distribution
- **Notifications**: Email confirmations to users
- **Logging**: Complete transaction records

### PIN Management
- **Generation**: Secure 6-digit PINs for withdrawals
- **Expiry**: 30-minute automatic expiration
- **One-Time Use**: PINs become invalid after use
- **Audit Trail**: Complete PIN usage tracking

## 📈 Analytics & Monitoring

- **Performance Tracking**: Real-time system metrics
- **Error Logging**: Comprehensive error tracking
- **User Analytics**: Privacy-friendly usage statistics
- **Transaction Monitoring**: Complete financial audit trail

## 🌐 Deployment

### Environment Setup
1. **Production Database**: PostgreSQL with connection pooling
2. **Environment Variables**: Secure configuration management
3. **SSL Certificates**: HTTPS encryption
4. **Domain Configuration**: Custom domain setup
5. **Email Delivery**: Production email service configuration

### Hosting Options
Detailed guides provided for:
- **Cloudflare Pages + Workers**: Serverless deployment
- **Firebase Hosting + Functions**: Google Cloud deployment
- **Traditional VPS**: Self-hosted deployment

## 📚 Documentation

- **API Documentation**: Complete endpoint documentation
- **User Guide**: Step-by-step user instructions
- **Admin Guide**: Administrative procedures
- **Deployment Guide**: Production deployment instructions
- **Troubleshooting**: Common issues and solutions

## 🤝 Support

### Live Chat
- **Integration**: Jivo Chat widget on all pages
- **Availability**: 24/7 customer support
- **Script**: `//code.jivosite.com/widget/foeFKzf8Lf`

### Contact Information
- **Email**: bluerockasset@zohomail.com
- **Phone**: +1 (555) 123-4567
- **Address**: 123 Financial District, New York, NY 10004

## ⚖️ Legal & Compliance

### Included Documents
- **Privacy Policy**: GDPR and CCPA compliant
- **Terms of Service**: Comprehensive legal terms
- **Risk Disclosure**: Investment risk warnings
- **AML Policy**: Anti-money laundering procedures
- **Compliance**: Regulatory compliance information

### Regulatory Features
- **KYC Verification**: Identity verification system
- **AML Monitoring**: Transaction monitoring
- **Audit Trails**: Complete activity logging
- **Reporting**: Regulatory reporting capabilities

## 🔧 Development

### Scripts
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Database operations
npm run db:migrate
npm run db:seed
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 📄 License

This project is proprietary software developed for BlueRock Asset Management. All rights reserved.

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service and credentials
2. **Email Delivery**: Verify Zoho Mail configuration
3. **Build Errors**: Clear node_modules and reinstall dependencies
4. **Port Conflicts**: Ensure ports 3000 and 3001 are available

### Getting Help
- Check the documentation in `/docs`
- Review error logs in the console
- Contact support at bluerockasset@zohomail.com

---

**BlueRock Asset Management** - Professional Cryptocurrency Investment Platform