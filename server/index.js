/**
 * BACKEND SUNUCUSU
 * 
 * Express.js kullanarak RESTful API sunucusu
 * Tüm API endpoint'lerini yönetir
 * 
 * ⚠️ GÜVENLİK ÖNLEMLERİ AKTIF ⚠️
 * - Rate Limiting
 * - Helmet.js (Security Headers)
 * - CORS Protection
 * - Input Validation
 * - Request Size Limits
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');
const session = require('express-session');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// GÜVENLİK MIDDLEWARE'LERİ
// ============================================

// 1. Helmet.js - Security Headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:', 'http:'],
  },
}));

// 2. Rate Limiting - Brute Force Koruması
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP'ye 15 dakikada 100 istek
  message: 'Bu IP adresinden çok fazla istek yapıldı, lütfen sonra tekrar deneyin.',
  standardHeaders: true, // RateLimit bilgisini headers'da ver
  legacyHeaders: false, // X-RateLimit headers'ı devre dışı bırak
  skip: (req) => {
    // localhost'dan gelen istekleri atla (development için)
    return req.ip === '::1' || req.ip === '127.0.0.1';
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Hassas işlemler için (login, register vb.)
  message: 'Çok fazla deneme, 15 dakika sonra tekrar deneyin.'
});

app.use('/api/', limiter); // Tüm API'ye rate limit uygula
app.use('/api/ai/chat', strictLimiter); // AI'ye daha sıkı limit

// 3. Body Parser - Güvenli boyut limitleri
app.use(express.json({ limit: '10mb' })); // Daha güvenli limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// PHASE 4: Session Management (for OAuth & WebAuthn)
app.use(session({
  secret: process.env.SESSION_SECRET || 'wellibuy-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CRITICAL: Changed from 'lax' to 'strict'
  }
}));

// PHASE 4: Passport.js initialization
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const User = require('./models/User').default;
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// 4. MongoDB Injection Koruması - NoSQL Sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized field ${key} in ${req.method} ${req.path}`);
  },
}));

// 5. CORS - Frontend'den gelen isteklere kontrollü izin
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL // Production URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy tarafından reddedildi'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 saat
}));

// 6. Security Headers - Ekstra Güvenlik
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// PHASE 4: Advanced Security Middleware
// Security middleware
const { checkTokenBlacklist } = require('./services/tokenBlacklist');
app.use(checkTokenBlacklist);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// VERITABANI BAĞLANTISI
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellibuy';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB bağlantısı başarılı');
  })
  .catch((error) => {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  });

// ============================================
// TEMEL ROUTE'LAR
// ============================================

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Wellibuy API çalışıyor',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API dökümanı
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Wellibuy API v1.0',
    endpoints: {
      health: 'GET /api/health',
      products: {
        list: 'GET /api/products',
        search: 'GET /api/products/search',
        detail: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id'
      },
      ai: {
        recommendations: 'POST /api/ai/recommendations',
        pcBuilder: 'POST /api/ai/pc-builder',
        scanProduct: 'POST /api/ai/scan-product',
        ingredientAnalysis: 'POST /api/ai/ingredients',
        smartSearch: 'POST /api/ai/smart-search'
      },
      categories: {
        list: 'GET /api/categories',
        products: 'GET /api/categories/:name/products'
      }
    }
  });
});

// ============================================
// ROUTE MODÜLLER
// ============================================

// Routes dosyalarını import et
try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
} catch (e) {
  console.log('⚠️  Products routes hata:', e.message);
}

try {
  const aiRoutes = require('./routes/ai');
  app.use('/api/ai', aiRoutes);
} catch (e) {
  console.log('⚠️  AI routes hata:', e.message);
}

try {
  const categoryRoutes = require('./routes/categories');
  app.use('/api/categories', categoryRoutes);
} catch (e) {
  console.log('⚠️  Categories routes hata:', e.message);
}

// PHASE 1: Core Auth Routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.log('⚠️  Auth routes hata:', e.message);
}

try {
  const usersRoutes = require('./routes/users');
  app.use('/api/users', usersRoutes);
} catch (e) {
  console.log('⚠️  Users routes hata:', e.message);
}

// ============================================
// HATA YÖNETİMİ
// ============================================

// 404 - Sayfa bulunamadı
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.path
  });
});

// Genel hata yakalama
app.use((err, req, res, next) => {
  console.error('❌ Sunucu hatası:', err);
  res.status(500).json({
    success: false,
    error: 'Sunucu hatası',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// ============================================
// SUNUCUYU BAŞLAT
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Wellibuy API Sunucusu Başlatıldı    ║
╠═══════════════════════════════════════════╣
║   Port: ${PORT}                           ║
║   Ortam: ${process.env.NODE_ENV || 'development'}              ║
║   API: http://localhost:${PORT}/api       ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏸️  Sunucu kapatılıyor...');
  await mongoose.connection.close();
  console.log('✅ Veritabanı bağlantısı kapatıldı');
  process.exit(0);
});

module.exports = app;
