/**
 * ÖRNEK ÜRÜNLERİ YÜKLEMEK İÇİN SCRİPT
 * 
 * Bu script veritabanına örnek ürünler ekler
 * Kullanım: node scripts/seed-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB'ye bağlan
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellibuy';

// Ürün şeması
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  subcategory: String,
  brand: String,
  model: String,
  images: [String],
  specifications: [{
    name: String,
    value: String,
    category: String,
    unit: String
  }],
  prices: [{
    siteName: String,
    price: Number,
    url: String,
    inStock: Boolean,
    lastUpdated: Date
  }],
  ingredients: [{
    name: String,
    status: String,
    description: String,
    healthScore: Number
  }],
  rating: Number,
  reviewCount: Number
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

// Örnek ürünler
const sampleProducts = [
  {
    name: 'NVIDIA GeForce RTX 5090 Suprim Liquid',
    description: 'En yeni nesil RTX 5090 ekran kartı. Sıvı soğutmalı, yüksek performans, ray tracing ve DLSS 4.0 desteği.',
    category: 'Bilgisayar',
    subcategory: 'Ekran Kartı',
    brand: 'MSI',
    model: 'RTX 5090 Suprim Liquid',
    images: ['https://via.placeholder.com/500x500/0ea5e9/ffffff?text=RTX+5090'],
    specifications: [
      { name: 'İşlemci', value: 'Ada Lovelace', category: 'Donanım' },
      { name: 'Bellek', value: '24GB GDDR6X', category: 'Donanım', unit: 'GB' },
      { name: 'Soğutma', value: 'Sıvı Soğutma', category: 'Donanım' },
      { name: 'TDP', value: '450W', category: 'Güç', unit: 'W' },
      { name: 'Ray Tracing', value: 'Evet', category: 'Özellik' },
      { name: 'DLSS', value: '4.0', category: 'Özellik' }
    ],
    prices: [
      { siteName: 'Trendyol', price: 89999, url: 'https://trendyol.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'Hepsiburada', price: 92499, url: 'https://hepsiburada.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'N11', price: 91999, url: 'https://n11.com', inStock: false, lastUpdated: new Date() }
    ],
    rating: 4.9,
    reviewCount: 237
  },
  {
    name: 'Apple MacBook Pro M5 14-inch',
    description: 'Yeni M5 çip ile müthiş performans. 14 inç Liquid Retina XDR ekran, 18 saate kadar pil ömrü.',
    category: 'Bilgisayar',
    subcategory: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro M5',
    images: ['https://via.placeholder.com/500x500/000000/ffffff?text=MacBook+Pro'],
    specifications: [
      { name: 'İşlemci', value: 'Apple M5', category: 'Donanım' },
      { name: 'RAM', value: '16GB', category: 'Donanım', unit: 'GB' },
      { name: 'Depolama', value: '512GB SSD', category: 'Depolama', unit: 'GB' },
      { name: 'Ekran', value: '14 inç Retina', category: 'Görüntü', unit: 'inç' },
      { name: 'Pil', value: '18 saat', category: 'Pil', unit: 'saat' },
      { name: 'Ağırlık', value: '1.6 kg', category: 'Fiziksel', unit: 'kg' }
    ],
    prices: [
      { siteName: 'Apple Store', price: 74999, url: 'https://apple.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'MediaMarkt', price: 76499, url: 'https://mediamarkt.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Teknosa', price: 75999, url: 'https://teknosa.com', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.8,
    reviewCount: 892
  },
  {
    name: 'Ülker Çikolatalı Gofret 36g',
    description: 'Lezzetli çikolatalı gofret. İçindeki çikolata kreması ve gevrek gofret katmanları ile enfes bir tat.',
    category: 'Gıda',
    subcategory: 'Atıştırmalık',
    brand: 'Ülker',
    model: '36g Paket',
    images: ['https://via.placeholder.com/500x500/8B4513/ffffff?text=Gofret'],
    specifications: [
      { name: 'Ağırlık', value: '36g', category: 'Fiziksel', unit: 'g' },
      { name: 'Kalori', value: '185 kcal', category: 'Besin', unit: 'kcal' },
      { name: 'Protein', value: '2.1g', category: 'Besin', unit: 'g' },
      { name: 'Karbonhidrat', value: '22g', category: 'Besin', unit: 'g' },
      { name: 'Yağ', value: '10g', category: 'Besin', unit: 'g' }
    ],
    ingredients: [
      { name: 'Un', status: 'yararlı', description: 'Temel gıda maddesi', healthScore: 6 },
      { name: 'Şeker', status: 'şüpheli', description: 'Fazla tüketilmemeli', healthScore: 4 },
      { name: 'Bitkisel Yağ', status: 'yararlı', description: 'Enerji kaynağı', healthScore: 5 },
      { name: 'Kakao', status: 'yararlı', description: 'Antioksidan içerir', healthScore: 7 },
      { name: 'E471', status: 'şüpheli', description: 'Katkı maddesi, ölçülü tüketilmeli', healthScore: 5 }
    ],
    prices: [
      { siteName: 'Migros', price: 4.50, url: 'https://migros.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Carrefour', price: 4.25, url: 'https://carrefour.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Şok', price: 3.95, url: 'https://sok.com.tr', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.5,
    reviewCount: 1523
  },
  {
    name: 'Coca Cola Zero 330ml',
    description: 'Şekersiz Coca Cola. Klasik Coca Cola tadı, sıfır kalori.',
    category: 'İçecek',
    subcategory: 'Gazlı İçecek',
    brand: 'Coca Cola',
    model: '330ml Kutu',
    images: ['https://via.placeholder.com/500x500/FF0000/ffffff?text=Coca+Cola'],
    specifications: [
      { name: 'Hacim', value: '330ml', category: 'Fiziksel', unit: 'ml' },
      { name: 'Kalori', value: '0 kcal', category: 'Besin', unit: 'kcal' },
      { name: 'Şeker', value: '0g', category: 'Besin', unit: 'g' },
      { name: 'Kafein', value: '32mg', category: 'İçerik', unit: 'mg' }
    ],
    ingredients: [
      { name: 'Su', status: 'yararlı', description: 'Temel içerik', healthScore: 10 },
      { name: 'Karbondioksit', status: 'yararlı', description: 'Gazlandırıcı', healthScore: 7 },
      { name: 'Aspartam', status: 'zararlı', description: 'Yapay tatlandırıcı, dikkatli tüketilmeli', healthScore: 2 },
      { name: 'Kafein', status: 'şüpheli', description: 'Ölçülü tüketilmeli', healthScore: 5 },
      { name: 'E150d', status: 'şüpheli', description: 'Karamel renklendirici', healthScore: 4 }
    ],
    prices: [
      { siteName: 'Migros', price: 8.50, url: 'https://migros.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'A101', price: 7.95, url: 'https://a101.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'BIM', price: 7.75, url: 'https://bim.com.tr', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.3,
    reviewCount: 3421
  },
  {
    name: 'Intel Core i9-14900K İşlemci',
    description: '24 çekirdek, 32 thread. 6.0 GHz turbo hızı. Oyun ve iş yükü için mükemmel performans.',
    category: 'Bilgisayar',
    subcategory: 'İşlemci',
    brand: 'Intel',
    model: 'i9-14900K',
    images: ['https://via.placeholder.com/500x500/0071C5/ffffff?text=Intel+i9'],
    specifications: [
      { name: 'Çekirdek', value: '24', category: 'Donanım' },
      { name: 'Thread', value: '32', category: 'Donanım' },
      { name: 'Temel Frekans', value: '3.2 GHz', category: 'Performans', unit: 'GHz' },
      { name: 'Turbo Frekans', value: '6.0 GHz', category: 'Performans', unit: 'GHz' },
      { name: 'Önbellek', value: '36MB', category: 'Donanım', unit: 'MB' },
      { name: 'TDP', value: '125W', category: 'Güç', unit: 'W' }
    ],
    prices: [
      { siteName: 'İncehesap', price: 24999, url: 'https://incehesap.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'Vatan Bilgisayar', price: 25499, url: 'https://vatanbilgisayar.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'Hepsiburada', price: 25999, url: 'https://hepsiburada.com', inStock: false, lastUpdated: new Date() }
    ],
    rating: 4.7,
    reviewCount: 445
  },
  {
    name: 'Samsung 870 EVO 1TB SSD',
    description: 'SATA 3.0 SSD. 560 MB/s okuma, 530 MB/s yazma hızı. Güvenilir depolama çözümü.',
    category: 'Bilgisayar',
    subcategory: 'Depolama',
    brand: 'Samsung',
    model: '870 EVO 1TB',
    images: ['https://via.placeholder.com/500x500/1428A0/ffffff?text=Samsung+SSD'],
    specifications: [
      { name: 'Kapasite', value: '1TB', category: 'Depolama', unit: 'TB' },
      { name: 'Tip', value: 'SATA 3.0', category: 'Donanım' },
      { name: 'Okuma Hızı', value: '560 MB/s', category: 'Performans', unit: 'MB/s' },
      { name: 'Yazma Hızı', value: '530 MB/s', category: 'Performans', unit: 'MB/s' },
      { name: 'Form Faktör', value: '2.5 inç', category: 'Fiziksel', unit: 'inç' }
    ],
    prices: [
      { siteName: 'Amazon', price: 2499, url: 'https://amazon.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Hepsiburada', price: 2599, url: 'https://hepsiburada.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'Trendyol', price: 2549, url: 'https://trendyol.com', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.8,
    reviewCount: 1893
  }
];

async function seedProducts() {
  try {
    console.log('🔄 MongoDB\'ye bağlanıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    console.log('🗑️  Mevcut ürünler temizleniyor...');
    await Product.deleteMany({});
    console.log('✅ Eski ürünler silindi\n');

    console.log('📦 Yeni ürünler ekleniyor...');
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`✅ ${inserted.length} ürün başarıyla eklendi\n`);

    console.log('📊 Eklenen Ürünler:');
    inserted.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.category}`);
    });

    console.log('\n🎉 Örnek veriler başarıyla yüklendi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

seedProducts();
