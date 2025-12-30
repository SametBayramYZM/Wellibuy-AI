# 🔐 WELLIBUY AI - GÜVENLIK POLİTİKASI & İlkeleri

## 📜 Table of Contents
1. [Genel Güvenlik İlkeleri](#genel-güvenlik-ilkeleri)
2. [Veri Gizliliği](#veri-gizliliği)
3. [Erişim Kontrolü](#erişim-kontrolü)
4. [İlgili Taraflar](#ilgili-taraflar)
5. [Yasal Uyum](#yasal-uyum)

---

## 🛡️ Genel Güvenlik İlkeleri

### 1. Defense in Depth (Katmanlı Savunma)
Hiçbir tek güvenlik önlemi 100% etkili olmadığı için, birden çok katman kullanıyoruz:

```
User → Firewall → Load Balancer → HTTPS → API Gateway → 
Rate Limiting → Input Validation → Authentication → Authorization → 
Database (Encryption) → Backup (Encrypted)
```

### 2. Least Privilege (En Az Yetki Prensibi)
Her kullanıcı ve servis sadece gerekli izinlere sahip:

```javascript
// ✅ Good
db.createUser({
  user: "api_user",
  roles: [{ role: "read", db: "wellibuy" }]  // Read-only
});

// ❌ Bad
db.createUser({
  user: "api_user",
  roles: [{ role: "root" }]  // Way too much power
});
```

### 3. Security by Default
Varsayılan ayarlar en güvenli yapılandırmayı sağlar:

```javascript
// ❌ Insecure defaults (never used)
const app = express();
app.use(cors());  // Allows ALL origins

// ✅ Secure defaults (our implementation)
const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  sameSite: 'Strict'
}));
```

### 4. Fail Securely (Güvenli Başarısızlık)
Sistem başarısız olursa, açık bırakmıyor kapatıyor:

```javascript
// ❌ Insecure failure
try {
  authenticateUser();
} catch (e) {
  res.send({ success: true });  // Continues anyway!
}

// ✅ Secure failure
try {
  authenticateUser();
} catch (e) {
  res.status(401).send({ error: 'Unauthorized' });
  return;  // Stops execution
}
```

---

## 🔒 Veri Gizliliği

### PII (Personally Identifiable Information) Tanımı
Kişiye özgü bilgiler:
- Ad, Soyad
- Email, Telefon
- Adres
- Kredi Kartı Numarası
- Kimlik Numarası
- Konum Bilgisi

### PII Koruma Stratejisi

#### 1. **Minimization (Minimizasyon)**
```javascript
// ❌ Store unnecessary data
user: {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  ssn: "123-45-6789",
  salary: 100000,  // Why do we need this?
  mother_maiden_name: "Smith"  // Seriously?
}

// ✅ Store only needed data
user: {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890"  // For order delivery only
}
```

#### 2. **Encryption at Rest**
```javascript
// Database encryption
const schema = new mongoose.Schema({
  email: String,
  phone: {
    type: String,
    encrypt: true  // Stored encrypted
  },
  address: {
    type: String,
    encrypt: true
  }
});
```

#### 3. **Encryption in Transit**
```javascript
// ✅ Always use HTTPS
https.createServer(sslOptions, app).listen(443);

// ❌ Never use HTTP for sensitive data
// Only acceptable for health checks from load balancers
```

#### 4. **Logging Policy**
```javascript
// ❌ Never log
- Passwords
- API Keys
- Credit card numbers
- SSN/ID numbers
- Full IP addresses (use anonymized)

// ✅ Safe to log
- User ID (not name)
- Action type
- Timestamp
- HTTP status code
- Error type (not message)
```

### Data Retention Policy

```
Type                  Duration    Reason
─────────────────────────────────────────────
User Account          Forever     Until deletion
Transactions          7 years     Financial/Legal
Logs (error)          90 days     Debugging
Logs (access)         30 days     Audit trail
Logs (security)       1 year      Compliance
Backups               30 days     Recovery
Deleted User Data     30 days     GDPR right to delete
```

### Right to Delete (GDPR)
```javascript
// User requests data deletion
router.delete('/api/users/:id/data', auth, async (req, res) => {
  // 1. Anonymize user data
  const user = await User.findById(req.params.id);
  user.email = `deleted_${user._id}@wellibuy.local`;
  user.phone = null;
  user.address = null;
  await user.save();
  
  // 2. Delete personal files
  await FileStorage.deleteUserFiles(user._id);
  
  // 3. Keep anonymized transaction records (legal requirement)
  // Don't delete orders - needed for financial audit
  
  // 4. Confirm deletion
  res.json({ success: true, message: 'All personal data deleted' });
});
```

---

## 👥 Erişim Kontrolü

### Role-Based Access Control (RBAC)

```javascript
const roles = {
  'guest': {
    can: ['view_products', 'search', 'view_categories']
  },
  'user': {
    can: ['view_products', 'search', 'make_order', 'view_own_orders', 'build_pc']
  },
  'moderator': {
    can: ['view_products', 'flag_content', 'message_users']
  },
  'admin': {
    can: ['manage_products', 'manage_users', 'manage_orders', 'view_analytics']
  },
  'superadmin': {
    can: ['*']  // All permissions
  }
};

// Middleware
function authorize(...requiredRoles) {
  return (req, res, next) => {
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.delete('/api/products/:id', authorize('admin', 'superadmin'), deleteProduct);
```

### Session Management

```javascript
// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // JavaScript cannot access
    secure: true,        // HTTPS only
    sameSite: 'Strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  },
  store: new MongoStore({ // Server-side storage
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60
  })
};

app.use(session(sessionConfig));
```

### Multi-Factor Authentication (MFA)

```javascript
// TOTP-based MFA
const speakeasy = require('speakeasy');

// 1. Generate secret on registration
const secret = speakeasy.generateSecret({
  name: `Wellibuy (${user.email})`,
  issuer: 'Wellibuy'
});

user.mfa_secret = secret.base32;  // Encrypted in DB
user.mfa_enabled = false;  // Not enabled yet

// 2. User scans QR code
res.json({ qrCode: secret.qr_code, secret: secret.base32 });

// 3. User enters verification code
const verified = speakeasy.totp.verify({
  secret: user.mfa_secret,
  encoding: 'base32',
  token: req.body.code,
  window: 2  // Allow time drift
});

if (verified) {
  user.mfa_enabled = true;
  await user.save();
  res.json({ success: true });
}
```

---

## 🚨 İlgili Taraflar (Incident Management)

### Security Vulnerability Disclosure
Güvenlik açığı buldunuz mu?

```
❌ DON'T
- Post publicly on social media
- Tell friends
- Try to exploit it
- Use it to gain access

✅ DO
- Email: security@wellibuy.com
- Provide: Description, steps to reproduce, impact
- Wait: We'll respond within 24-48 hours
- Reward: Bug bounty program ($100-$5000)
```

### Incident Response Timeline

```
T+0      → Incident detected
         → Alert team
         → Start incident response

T+1min   → Triage severity
         ├─ Critical: Complete outage/data breach
         ├─ High: Functionality impaired
         ├─ Medium: Minor feature broken
         └─ Low: Non-critical issue

T+5min   → Mitigation started
         ├─ Block malicious IPs
         ├─ Rotate compromised credentials
         ├─ Isolate affected systems
         └─ Disable vulnerable features

T+30min  → Status update sent
         └─ Notify stakeholders

T+1h     → Root cause analysis
         └─ Determine what happened

T+4h     → Fix deployed
         └─ Monitoring increased

T+24h    → Post-incident review
         ├─ Documentation
         ├─ Process improvements
         └─ Team debrief
```

### Communication Template

```
INCIDENT REPORT
═══════════════════════════════════════════════════════════

Title: Data exposure in user profiles
Severity: HIGH
Detected: 2025-12-30 14:23 UTC
Resolved: 2025-12-30 14:47 UTC

SUMMARY:
Due to a bug in the API, user email addresses were visible 
in public product comment sections.

IMPACT:
- ~500 users' email addresses exposed
- ~48 hour exposure window
- No other data was accessed

REMEDIATION:
- Fix deployed and tested
- Cleaned up exposed comments
- Notified affected users
- Implemented stricter access controls

PREVENTION:
- Added API endpoint security audit
- Implemented automated testing for PII
- Increased monitoring for data exposure
```

---

## ⚖️ Yasal Uyum

### GDPR (General Data Protection Regulation)

```javascript
// GDPR Checklist
✅ Right to Access
   - Users can download their data
   router.get('/api/users/:id/gdpr-export', auth, async (req, res) => {
     const user = await User.findById(req.params.id);
     res.json(user); // All their data
   });

✅ Right to Rectification
   - Users can update their data
   router.put('/api/users/:id', auth, async (req, res) => {
     // Update user profile
   });

✅ Right to Erasure (Right to be Forgotten)
   - Users can request data deletion
   router.delete('/api/users/:id/erasure', auth, async (req, res) => {
     // Delete all personal data
   });

✅ Right to Restrict Processing
   - Users can restrict data usage
   user.data_processing_restricted = true;

✅ Right to Data Portability
   - Users can get data in machine-readable format
   router.get('/api/users/:id/export.json', auth, ...);

✅ Right to Object
   - Users can object to processing
   router.post('/api/users/:id/object-processing', auth, ...);

✅ Consent Management
   - Explicit consent for data processing
   user.consents = {
     marketing_emails: false,
     analytics: true,
     profiling: false,
     third_party_sharing: false
   };
```

### Cookie Policy

```javascript
// Cookie Declaration
const cookies = {
  session_id: {
    purpose: 'User authentication',
    duration: '24 hours',
    type: 'Necessary',
    consent_required: false
  },
  preferences: {
    purpose: 'Save user preferences',
    duration: '1 year',
    type: 'Functionality',
    consent_required: true
  },
  analytics: {
    purpose: 'Track usage patterns',
    duration: '2 years',
    type: 'Analytics',
    consent_required: true
  },
  marketing: {
    purpose: 'Personalized ads',
    duration: '1 year',
    type: 'Marketing',
    consent_required: true
  }
};
```

### Privacy Policy Requirements

```
Your Privacy Policy must include:

✅ Data Controller Information
   - Your company details
   - Contact information

✅ Legal Basis for Processing
   - Consent
   - Contract
   - Legal obligation
   - Vital interests
   - Public task
   - Legitimate interests

✅ Data Categories & Purposes
   - Personal data types you collect
   - Why you collect them
   - How long you keep them

✅ Rights of Data Subjects
   - Access, rectification, erasure
   - Restriction, portability, objection
   - Automated decision-making

✅ International Transfers
   - Where data is transferred
   - Safeguards (Standard Clauses)

✅ Contact Information
   - Data Protection Officer
   - Privacy team email
   - Complaints procedure

✅ Cookie Policy
   - Types of cookies used
   - Purpose of each cookie
   - How to manage preferences
```

### Terms of Service

```
CRITICAL CLAUSES:

✅ Acceptable Use Policy
   - No illegal activities
   - No hacking attempts
   - No harassment
   - No spam
   - No DDOS attacks

✅ Limitation of Liability
   - We're not responsible for indirect damages
   - We're not liable for service interruptions
   - Maximum liability caps

✅ Indemnification
   - You hold us harmless
   - For your violations
   - For third-party claims

✅ Disclaimer
   - Service provided "as is"
   - No warranties expressed or implied
   - Use at your own risk

✅ Termination
   - We can terminate for violations
   - 30-day notice for convenience
   - Immediate for security issues

✅ Governing Law
   - Which jurisdiction's laws apply
   - Where disputes are resolved
```

---

## 📊 Security Metrics & KPIs

### Track These Metrics

```
Critical Metrics:
├─ Mean Time to Detect (MTTD): < 1 hour
├─ Mean Time to Respond (MTTR): < 5 minutes
├─ Mean Time to Resolution (MTTR): < 4 hours
├─ Security Incidents: Target = 0
├─ Password Reset Requests: Monitor for abuse
├─ Failed Login Attempts: Alert if > 10
├─ Rate Limit Violations: Monitor trends
└─ Data Breach Attempts: Should be blocked

Important Metrics:
├─ Vulnerability Assessment: Quarterly
├─ Patch Compliance: > 95%
├─ Security Training: 100% completion
├─ Code Review: 100% coverage
├─ Automated Testing: > 80% coverage
├─ Log Analysis: Daily review
└─ Backup Tests: Weekly restore test
```

### Monthly Security Report Template

```
WELLIBUY AI - MONTHLY SECURITY REPORT
Month: December 2025

EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════
Status: ✅ SECURE
Incidents: 0 critical, 0 high, 2 medium, 1 low
Actions: All resolved

INCIDENTS
═══════════════════════════════════════════════════════════
[List and status of all incidents]

VULNERABILITIES
═══════════════════════════════════════════════════════════
New: 3 CVEs reviewed - 2 not applicable, 1 patched
Open: 0 critical, 1 high, 3 medium (roadmap)

METRICS
═══════════════════════════════════════════════════════════
Uptime: 99.95%
MTTD: 15 minutes
MTTR: 47 minutes
Tests Passed: 98.5%

ACTIVITIES
═══════════════════════════════════════════════════════════
✅ Dependency updates (npm audit)
✅ SSL certificate renewal
✅ Database backup verification
✅ Security training completed
✅ Code security review

RECOMMENDATIONS
═══════════════════════════════════════════════════════════
1. [High Priority Issue]
2. [Medium Priority Issue]
3. [Nice to Have]

SIGN-OFF
═══════════════════════════════════════════════════════════
Security Team Lead: _________________
CEO/CTO: _________________
Date: _________________
```

---

## 🔄 Security Review Schedule

```
Weekly:
├─ Log review (errors, access patterns)
├─ Alert review (security events)
└─ Uptime check

Monthly:
├─ Vulnerability scan
├─ Dependency updates
├─ Security metrics review
└─ Incident report

Quarterly:
├─ Penetration testing
├─ Code security audit
├─ Policy review
└─ Team training update

Annually:
├─ Comprehensive security audit
├─ Third-party assessment
├─ Disaster recovery drill
└─ Policy revision
```

---

## 📚 Resources & References

**Security Standards:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)

**Best Practices:**
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Password Hashing](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

**Tools:**
- OWASP ZAP (security scanning)
- Burp Suite Community (penetration testing)
- npm audit (dependency vulnerabilities)
- Snyk (continuous vulnerability monitoring)
- SonarQube (code quality & security)

---

## 🆘 Questions?

**Email**: security@wellibuy.com  
**Report**: https://wellibuy.com/security/report  
**Status**: https://status.wellibuy.com  

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-30  
**Next Review**: 2025-01-30  

🔒 **Güvenlik Hepimizin Sorumluluğu!**
