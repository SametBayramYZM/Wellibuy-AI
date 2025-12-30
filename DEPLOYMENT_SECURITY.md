# 🚀 WELLIBUY AI - PRODUCTION DEPLOYMENT GUIDE

## ⚠️ PRE-DEPLOYMENT SECURITY CHECKLIST

### 1. 🔐 Environment Variables & Secrets

- [ ] **Create `.env.production`** from `.env.production.example`
```bash
cp .env.production.example .env.production
```

- [ ] **Fill All Required Secrets**
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/wellibuy?retryWrites=true&w=majority

# JWT & Sessions
JWT_SECRET=your-very-long-random-secret-here-min-32-chars
SESSION_SECRET=your-session-secret-here-min-32-chars

# API Keys
OPENAI_API_KEY=sk-your-key-here

# Security
ALLOWED_ORIGINS=https://wellibuy.com,https://www.wellibuy.com

# Backup
DATABASE_BACKUP_URI=s3://your-bucket/backups

# Monitoring
SENTRY_DSN=https://your-sentry-key@sentry.io/project-id
DATADOG_API_KEY=your-datadog-key
```

- [ ] **Secrets Generation Script**
```bash
# Generate secure random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **NEVER Commit `.env.production`**
```bash
# .gitignore already includes it
echo ".env.production" >> .gitignore
```

---

### 2. 🗄️ Database Security

#### MongoDB Atlas Setup
- [ ] Enable **IP Whitelist** - Add production server IP
- [ ] Use **Strong Username/Password** (32+ chars)
- [ ] Enable **Encryption at Rest** (M10+ tier)
- [ ] Enable **Encryption in Transit** (TLS/SSL)
- [ ] Create **Dedicated Admin User**
```javascript
db.createUser({
  user: "wellibuy_admin",
  pwd: "your-strong-password",
  roles: [
    { role: "dbOwner", db: "wellibuy" },
    { role: "backup", db: "admin" }
  ]
})
```

- [ ] Create **Read-Only User** (for reports)
```javascript
db.createUser({
  user: "wellibuy_readonly",
  pwd: "your-strong-password",
  roles: [
    { role: "read", db: "wellibuy" }
  ]
})
```

- [ ] Configure **Backup Strategy**
  - Automated daily backups
  - 30-day retention
  - Test restore process
  - Store backups in multiple regions

#### Database Indexing & Performance
```javascript
// Create indexes for common queries
db.products.createIndex({ category: 1 });
db.products.createIndex({ brand: 1 });
db.products.createIndex({ createdAt: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

---

### 3. 🌐 HTTPS & SSL/TLS

#### Certificate Management
- [ ] **Obtain SSL Certificate**
  - Using Let's Encrypt (free, auto-renewal)
  - Or purchase from certificate authority
  
```bash
# Using Certbot (Let's Encrypt)
sudo certbot certonly --standalone -d wellibuy.com -d www.wellibuy.com
```

- [ ] **Add to Node.js**
```javascript
// server/index.js
const https = require('https');
const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/wellibuy.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/wellibuy.com/fullchain.pem')
};

https.createServer(sslOptions, app).listen(443, () => {
  console.log('🔒 HTTPS Server running on port 443');
});
```

- [ ] **Force HTTPS Redirect**
```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

- [ ] **HSTS Header** (Already set by Helmet)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### 4. 🛡️ Firewall & Network Security

#### AWS Security Groups / Firewall Rules
```
Inbound Rules:
├─ Port 80 (HTTP) - From: 0.0.0.0/0 (for Let's Encrypt renewal)
├─ Port 443 (HTTPS) - From: 0.0.0.0/0 (users)
├─ Port 5001 (Backend) - From: Load Balancer only
└─ Port 22 (SSH) - From: Your IP only

Outbound Rules:
├─ Allow all HTTPS (443)
├─ Allow MongoDB (27017)
├─ Allow OpenAI API
└─ Allow backup storage (S3)
```

#### DDoS Protection
- [ ] Enable **Cloudflare** or **AWS Shield**
- [ ] Configure **Rate Limiting Rules**
- [ ] Enable **WAF (Web Application Firewall)**

---

### 5. 🔑 API Keys & Credentials

#### Key Rotation Schedule
- [ ] JWT Secrets: Every 6 months
- [ ] API Keys: Every 3 months
- [ ] Database Passwords: Every 3 months
- [ ] SSL Certificates: Before expiration
- [ ] Session Secrets: Every 6 months

#### Key Storage
```
❌ DON'T store in:
- Code files
- Version control
- Config files in repo
- Log files
- Email

✅ DO store in:
- Environment variables
- Secret management services (AWS Secrets Manager, HashiCorp Vault)
- Encrypted configuration files
- CI/CD secrets
```

#### Credential Rotation Script
```bash
#!/bin/bash
# scripts/rotate-secrets.sh

echo "🔑 Rotating secrets..."

# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env.production

# Generate new Session secret
NEW_SESSION_SECRET=$(openssl rand -hex 32)
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$NEW_SESSION_SECRET/" .env.production

# Restart service
systemctl restart wellibuy-api

echo "✅ Secrets rotated successfully"
echo "📝 Don't forget to update your CI/CD secrets too!"
```

---

### 6. 📊 Monitoring & Logging

#### Setup Sentry (Error Tracking)
```javascript
// server/index.js - Top of file
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

#### Setup Structured Logging
```javascript
// lib/logger.ts
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

#### Monitor Key Metrics
- [ ] API Response Times
- [ ] Database Query Performance
- [ ] Error Rates
- [ ] Memory Usage
- [ ] CPU Usage
- [ ] Authentication Failures
- [ ] Rate Limit Violations
- [ ] Data Access Patterns

---

### 7. 🔄 Deployment Pipeline

#### CI/CD Security Checks
```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: NPM Audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: ESLint Security Rules
        run: npm run lint
      
      - name: Secrets Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
      
      - name: Dependency Check
        run: npm install -g snyk && snyk test
```

#### Blue-Green Deployment
```bash
#!/bin/bash
# scripts/deploy.sh

BLUE_PORT=5001
GREEN_PORT=5002
FRONTEND_URL=https://wellibuy.com

echo "📦 Deploying to production..."

# Start new version on GREEN_PORT
NODE_ENV=production PORT=$GREEN_PORT npm start &
GREEN_PID=$!

sleep 30

# Health check
if curl -f http://localhost:$GREEN_PORT/api/health; then
  echo "✅ New version healthy, switching traffic..."
  
  # Switch load balancer (example)
  # aws elb set-instance-health ...
  
  echo "✅ Deployment successful!"
  kill $(lsof -t -i:$BLUE_PORT)  # Stop old version
else
  echo "❌ Health check failed, rolling back..."
  kill $GREEN_PID
  exit 1
fi
```

---

### 8. 🚨 Security Incident Response

#### Incident Response Plan
```
1. Detection
   ├─ Automated alerts (Sentry, Datadog)
   ├─ Manual monitoring
   └─ User reports

2. Containment
   ├─ Identify affected systems
   ├─ Isolate compromised accounts
   ├─ Block malicious IPs
   └─ Rotate compromised credentials

3. Investigation
   ├─ Review logs
   ├─ Analyze attack patterns
   ├─ Determine impact
   └─ Document findings

4. Recovery
   ├─ Apply security patches
   ├─ Restore from backups if needed
   ├─ Verify system integrity
   └─ Resume normal operations

5. Post-Incident
   ├─ Notify affected users
   ├─ Document lessons learned
   ├─ Update security policies
   └─ Conduct security audit
```

#### Emergency Contacts
```
Security Team: security@wellibuy.com
On-Call: +1-xxx-xxx-xxxx
Escalation: cto@wellibuy.com
Legal: legal@wellibuy.com
PR: pr@wellibuy.com
```

---

### 9. 📋 Deployment Checklist

**Pre-Deployment (24 hours before)**
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Database backup created
- [ ] Performance tested under load
- [ ] Rollback plan documented

**Day Of Deployment**
- [ ] Team notified
- [ ] Maintenance window scheduled
- [ ] Health check endpoints verified
- [ ] Logging system tested
- [ ] Monitoring alerts configured
- [ ] On-call team ready

**During Deployment**
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check database integrity
- [ ] Verify API responses
- [ ] Test critical user flows

**Post-Deployment (24-48 hours)**
- [ ] Monitor for issues
- [ ] Review logs for errors
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document any changes
- [ ] Plan next iteration

---

## 🔒 SECURITY BEST PRACTICES

### Keep Systems Updated
```bash
# Regular security updates
npm audit fix --audit-level=high
npm update

# Operating system
apt-get update && apt-get upgrade -y

# SSL certificates (auto-renewal)
certbot renew --quiet
```

### Regular Security Audits
- **Weekly**: Log reviews, alert analysis
- **Monthly**: Dependency updates, vulnerability scanning
- **Quarterly**: Penetration testing, security audit
- **Annually**: Third-party security assessment

### Data Backup Strategy
```
Daily Backups:
├─ Automated MongoDB backups
├─ Uploaded to S3 with encryption
├─ Retention: 30 days
└─ Test restore weekly

Monthly Backups:
├─ Full system backups
├─ Archived for 1 year
└─ Stored in multiple regions
```

---

## 📞 PRODUCTION SUPPORT

**Monitoring Dashboard**: https://monitoring.wellibuy.com/  
**Error Tracking**: https://sentry.io/projects/wellibuy/  
**Security Report**: https://security.wellibuy.com/  
**Status Page**: https://status.wellibuy.com/

---

## ✅ DEPLOYMENT SIGN-OFF

**Deployed by**: _______________  
**Date**: _______________  
**Approved by**: _______________  
**Notes**: _______________

---

**Last Updated**: 2025-12-30  
**Next Review**: 2025-01-30  

🔒 **Keep Your System Secure - Follow This Guide!**
