# 🔒 WELLIBUY AI - GÜVENLİK POLİCYSİ

## 📋 İçindekiler
1. [Genel Güvenlik](#genel-güvenlik)
2. [Backend Güvenliği](#backend-güvenliği)
3. [Frontend Güvenliği](#frontend-güvenliği)
4. [Veritabanı Güvenliği](#veritabanı-güvenliği)
5. [API Güvenliği](#api-güvenliği)
6. [Deployment Güvenliği](#deployment-güvenliği)

---

## 🛡️ Genel Güvenlik

### ✅ Uygulanmış Önlemler

#### 1. **Rate Limiting (Hız Sınırlaması)**
- **Amaç**: Brute-force ve DDoS saldırılarını önlemek
- **Uygulama**:
  - Varsayılan: 100 istek / 15 dakika
  - Hassas işlemler: 5 istek / 15 dakika (login, password reset)
  - Arama: 30 istek / dakika
  
```javascript
// Örnek
POST /api/users/login -> Max 5 istek/15min
GET /api/products -> Max 100 istek/15min
```

#### 2. **CORS (Cross-Origin Resource Sharing)**
- **Amaç**: Sadece yetkili domainlerden istek kabul et
- **Allowed Origins**:
  - http://localhost:3000 (geliştirme)
  - http://localhost:3001 (geliştirme)
  - process.env.FRONTEND_URL (production)

#### 3. **Security Headers**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [özel ayarlar]
```

#### 4. **Input Validation & Sanitization**
- Tüm gelen veriler validate edilir
- NoSQL injection koruması (MongoDB sanitization)
- XSS koruması (HTML escape)
- Maksimum string uzunlukları kontrol edilir

```javascript
// Geçersiz girişler reddedilir
if (!validator.isEmail(email)) {
  return res.status(400).json({ error: 'Geçersiz email' });
}
```

---

## 🔐 Backend Güvenliği

### 1. **Helmet.js**
- Otomatik security headers ekler
- Clickjacking koruması
- MIME type sniffing koruması
- XSS Filter aktivasyonu

### 2. **Token-Based Authentication (JWT)**
```javascript
// Token oluşturma
const token = jwt.sign(
  { userId, email },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Token doğrulama
app.use(authMiddleware); // Protected routes'lar
```

**Token Özellikleri**:
- 24 saatlik geçerlilik
- İmzalı (tampering yok)
- Şifreli (secure)
- HttpOnly cookie'lerde saklanır

### 3. **Password Security**
- **Minimum Gereksinimler**:
  - 8+ karakter
  - 1 büyük harf (A-Z)
  - 1 küçük harf (a-z)
  - 1 rakam (0-9)
  - 1 özel karakter (!@#$%^&*)

- **Şifreleme**: bcrypt (salt: 10)
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

### 4. **Request Body Limits**
- JSON: max 10MB
- URL-encoded: max 10MB
- Prevents: Buffer overflow, DoS attacks

### 5. **Error Handling**
- Detaylı hata mesajları sadece development'ta gösterilir
- Production'da generic mesajlar
- Stack trace'ler logsunda kaydedilir

```javascript
// Development: "Invalid syntax in query"
// Production: "A server error occurred"
```

---

## 🎨 Frontend Güvenliği

### 1. **XSS (Cross-Site Scripting) Koruması**
- Tüm user input'lar escape edilir
- React otomatik XSS koruması sağlar
- Dangerously HTML kurulmuyor

```tsx
// ✅ Güvenli
<div>{userData}</div>

// ❌ Tehlikeli (kullanma!)
<div dangerouslySetInnerHTML={{__html: userData}} />
```

### 2. **CSRF (Cross-Site Request Forgery) Koruması**
- CSRF token kullanılır
- SameSite cookie ayarları
- Origin header kontrolü

### 3. **Secure Cookies**
```javascript
cookie: {
  secure: true,      // HTTPS only
  httpOnly: true,    // JavaScript erişimine kapalı
  sameSite: 'Strict' // CSRF koruması
}
```

### 4. **Content Security Policy (CSP)**
```html
<!-- next.config.js'de tanımlı -->
default-src: 'self'
script-src: 'self'
style-src: 'self' 'unsafe-inline'
img-src: 'self' data: https:
```

### 5. **Environment Variables**
- Sensitive data (API keys, secrets) `.env` dosyasında
- `.env` file'ı `.gitignore`'da
- **Asla** public'te commit etme

```bash
# ✅ .env (gitignore'da)
JWT_SECRET=your-secret-key

# ❌ Hiçbir zaman
OPENAI_API_KEY=sk-...
```

---

## 💾 Veritabanı Güvenliği

### 1. **Connection Security**
- SSL/TLS encryption
- Authenticated connections
- Network isolation

```javascript
// .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?ssl=true
```

### 2. **Data Validation (Mongoose)**
```javascript
const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  price: {
    type: Number,
    min: 0,
    required: true
  }
});
```

### 3. **SQL/NoSQL Injection Koruması**
```javascript
// ❌ Tehlikeli
db.find({ category: req.query.category });

// ✅ Güvenli (sanitized)
const category = validator.trim(req.query.category);
db.find({ category });
```

### 4. **Access Control**
- Role-based access (admin, user, guest)
- Database-level permissions
- Audit logging

### 5. **Backup & Recovery**
- Günlük otomatik backups
- Şifreli backups
- 30 günlük retention

---

## 🔌 API Güvenliği

### 1. **API Key Validation**
```javascript
// Header'da zorunlu
Authorization: Bearer <JWT_TOKEN>
```

### 2. **Endpoint Security**
```javascript
// Public endpoints
GET /api/products
GET /api/categories

// Protected endpoints (JWT required)
POST /api/users/register
POST /api/users/login
DELETE /api/products/:id (admin only)
```

### 3. **Response Security**
- Sensitif bilgiler (passwords, tokens) response'ta yok
- CORS headers doğru ayarlanmış
- Content-Type doğru set edilmiş

```javascript
// ❌ Hiçbir zaman
{ user: { password: 'hashed_pass' } }

// ✅ Güvenli
{ user: { id, email, name } }
```

### 4. **Versioning**
- API versioning: `/api/v1/`, `/api/v2/`
- Backward compatibility
- Deprecation warnings

---

## 🚀 Deployment Güvenliği

### 1. **Environment Configuration**
```bash
# Production .env
NODE_ENV=production
FRONTEND_URL=https://wellibuy.com
JWT_SECRET=<strong-random-key>
OPENAI_API_KEY=<secret>
DATABASE_URL=<mongodb+srv://...>
```

### 2. **HTTPS/TLS**
- SSL certificate (Let's Encrypt)
- HSTS enabled
- Redirect HTTP → HTTPS

### 3. **Server Hardening**
- Firewall rules
- Only necessary ports open (80, 443)
- DDoS protection (Cloudflare)

### 4. **Monitoring & Logging**
- Real-time error tracking (Sentry)
- Log aggregation (ELK Stack)
- Security event logging

```javascript
// Logged events
- Failed login attempts
- Unauthorized API calls
- Data access patterns
- Permission changes
```

### 5. **CI/CD Security**
- Automated security tests
- Dependency vulnerability scanning
- Code review before merge
- Secrets scanning

---

## 📊 Checklist: Güvenlik Kontrolleri

### Frontend
- [ ] XSS protection aktif
- [ ] CSRF token validation
- [ ] Secure cookies
- [ ] CSP headers
- [ ] No hardcoded secrets

### Backend
- [ ] Rate limiting aktif
- [ ] CORS properly configured
- [ ] Input validation
- [ ] SQL/NoSQL injection protection
- [ ] Error handling
- [ ] Logging aktif
- [ ] JWT implementation
- [ ] Password hashing (bcrypt)

### Database
- [ ] SSL/TLS enabled
- [ ] Authentication required
- [ ] Data validation
- [ ] Backups scheduled
- [ ] Access control

### Deployment
- [ ] HTTPS enforced
- [ ] Environment variables secure
- [ ] Firewall configured
- [ ] Monitoring active
- [ ] Incident response plan

---

## 🚨 İncident Response

### Şüpheli Aktivite Durumunda
1. **Tespit Etme**
   - Logs'u kontrol et
   - Anomalileri belirle
   - Patterns'i analiz et

2. **İzolasyon**
   - Etkilenen instance'ı kapat
   - Trafiği yönlendir
   - Backups al

3. **Investigation**
   - Root cause analiz
   - Affected data belirle
   - Impact assessment

4. **Recovery**
   - Clean backup'tan restore
   - Patches uygula
   - Tests çalıştır

5. **Communication**
   - Users'ı bilgilendir
   - Authorities'yi notify et
   - Post-mortem raporu yaz

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 👤 Sorumlu Taraf

**Security Officer**: [Admin]  
**Last Updated**: 2025-12-30  
**Next Review**: 2025-01-30

---

**⚠️ DİKKAT**: Bu document'i sadece yetkili personel ile paylaş. Sensitive bilgiler içerir.
