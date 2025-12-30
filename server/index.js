/**
 * BACKEND SUNUCUSU
 * 
 * Express.js kullanarak RESTful API sunucusu
 * Tüm API endpoint'lerini yönetir
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE'LER
// ============================================

// CORS - Frontend'den gelen isteklere izin ver
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// JSON verileri parse et
app.use(express.json({ limit: '50mb' })); // Büyük görseller için limit artırıldı
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request loglama
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// VERITABANI BAĞLANTISI
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellibuy';

mongoose.connect(MONGODB_URI)
  .then(() => {
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
const productRoutes = require('./routes/products');
const aiRoutes = require('./routes/ai');
const categoryRoutes = require('./routes/categories');

// Route'ları kullan
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoryRoutes);

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
