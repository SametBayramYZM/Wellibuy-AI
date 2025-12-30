# 📦 NPM PACKAGES - COMPLETE LIST

All dependencies for Wellibuy AI security features.

---

## ✅ Installation Commands

### One-Line Install (All Packages)

```bash
npm install express mongoose cors helmet dotenv express-rate-limit express-mongo-sanitize express-validator bcryptjs jsonwebtoken crypto-js passport passport-google-oauth20 passport-github2 passport-facebook @simplewebauthn/server @simplewebauthn/browser axios geoip-lite twilio multer stripe clamscan openpgp redis connect-redis && npm install --save-dev typescript @types/node @types/express @types/passport @types/passport-google-oauth20 @types/multer ts-node nodemon
```

---

## 📋 Package Breakdown

### Core Framework (5 packages)
```bash
npm install express mongoose cors helmet dotenv
```

**Purpose:**
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `dotenv` - Environment variables

---

### Security & Authentication (8 packages)
```bash
npm install express-rate-limit express-mongo-sanitize express-validator bcryptjs jsonwebtoken crypto-js passport
```

**Purpose:**
- `express-rate-limit` - Rate limiting
- `express-mongo-sanitize` - NoSQL injection protection
- `express-validator` - Input validation
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `crypto-js` - Encryption
- `passport` - Authentication middleware

---

### OAuth 2.0 / Social Login (3 packages)
```bash
npm install passport-google-oauth20 passport-github2 passport-facebook
```

**Purpose:**
- `passport-google-oauth20` - Google OAuth
- `passport-github2` - GitHub OAuth
- `passport-facebook` - Facebook Login

**Setup:**
- Google: https://console.cloud.google.com
- GitHub: https://github.com/settings/developers
- Facebook: https://developers.facebook.com

---

### WebAuthn / FIDO2 (2 packages)
```bash
npm install @simplewebauthn/server @simplewebauthn/browser
```

**Purpose:**
- Security key authentication (YubiKey, etc.)
- Biometric authentication (Face ID, Touch ID)

---

### Bot Detection & Threat Intelligence (2 packages)
```bash
npm install axios geoip-lite
```

**Purpose:**
- `axios` - HTTP requests for reCAPTCHA, threat APIs
- `geoip-lite` - IP geolocation lookup

**External APIs:**
- Google reCAPTCHA v3 (free)
- AbuseIPDB (1,000 checks/day free)
- IPQualityScore (5,000/month free)
- IPHub (1,000/day free)

---

### SMS / Phone Verification (1 package)
```bash
npm install twilio
```

**Purpose:**
- Send SMS verification codes
- Two-factor SMS authentication

**Setup:**
- Sign up: https://www.twilio.com
- Get: Account SID, Auth Token, Phone Number

---

### File Upload & Security (2 packages)
```bash
npm install multer clamscan
```

**Purpose:**
- `multer` - File upload middleware
- `clamscan` - Antivirus scanning (requires ClamAV)

**ClamAV Installation:**
```bash
# macOS
brew install clamav
freshclam

# Ubuntu
sudo apt-get install clamav clamav-daemon
sudo freshclam
```

---

### Payment & Webhooks (1 package)
```bash
npm install stripe
```

**Purpose:**
- Webhook signature verification
- Payment processing

**Also supports:**
- PayPal (built-in verification)
- Generic HMAC webhooks

---

### Email Encryption (1 package) - Optional
```bash
npm install openpgp
```

**Purpose:**
- PGP/GPG encrypted emails
- Secure notifications

---

### Redis (2 packages) - Optional but Recommended
```bash
npm install redis connect-redis
```

**Purpose:**
- Session storage
- Rate limit storage
- Token blacklist (faster than MongoDB)

**Redis Installation:**
```bash
# macOS
brew install redis
redis-server

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

---

### TypeScript & Development (7 packages)
```bash
npm install --save-dev typescript @types/node @types/express @types/passport @types/passport-google-oauth20 @types/multer ts-node nodemon
```

**Purpose:**
- TypeScript compilation
- Type definitions
- Development hot-reload

---

## 📊 Package Statistics

**Total Packages:** 30
**Production:** 23
**Development:** 7

**Dependencies by Category:**
- Core: 5
- Security: 8
- OAuth: 3
- WebAuthn: 2
- Threat Intelligence: 2
- SMS: 1
- File Upload: 2
- Payments: 1
- Encryption: 1
- Cache (Redis): 2
- TypeScript: 7

---

## 📝 package.json Example

```json
{
  "name": "wellibuy-ai",
  "version": "2.0.0",
  "description": "Maximum Security E-commerce Platform",
  "scripts": {
    "dev": "nodemon server/index.ts",
    "build": "tsc",
    "start": "node dist/server/index.js",
    "test": "jest",
    "audit": "npm audit"
  },
  "dependencies": {
    "@simplewebauthn/browser": "^8.3.0",
    "@simplewebauthn/server": "^8.3.0",
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "clamscan": "^2.1.2",
    "connect-redis": "^7.1.0",
    "cors": "^2.8.5",
    "crypto-js": "^4.2.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "geoip-lite": "^1.4.7",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "multer": "^1.4.5-lts.1",
    "openpgp": "^5.11.0",
    "passport": "^0.7.0",
    "passport-facebook": "^3.0.0",
    "passport-github2": "^0.1.12",
    "passport-google-oauth20": "^2.0.0",
    "redis": "^4.6.12",
    "stripe": "^14.10.0",
    "twilio": "^4.20.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/passport": "^1.0.16",
    "@types/passport-facebook": "^3.0.3",
    "@types/passport-github2": "^1.2.9",
    "@types/passport-google-oauth20": "^2.0.14",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

---

## ⚠️ Version Notes

- Use Node.js 18+ for best compatibility
- MongoDB 6+ required for TTL indexes
- Redis 6+ recommended for better performance

---

## 🔄 Update Commands

```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update specific package
npm update express

# Security audit
npm audit
npm audit fix
```

---

## 📈 Install Size

**Total:** ~250 MB
**node_modules:** ~230 MB
**TypeScript build:** ~5 MB

---

## ✅ Installation Verification

```bash
# Check installed packages
npm list --depth=0

# Verify critical packages
npm list express mongoose passport @simplewebauthn/server
```

---

**Last Updated:** December 30, 2025
**Wellibuy AI v2.0 - Maximum Security** 🔐
