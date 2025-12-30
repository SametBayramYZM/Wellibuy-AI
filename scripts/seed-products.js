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
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
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
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
    ],
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
    images: [
      'https://images.unsplash.com/photo-1497051788611-2c64812349b4?auto=format&fit=crop&w=900&q=80'
    ],
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
    images: [
      'https://images.unsplash.com/photo-1582719478248-54e9f2b1616a?auto=format&fit=crop&w=900&q=80'
    ],
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
    images: [
      'https://images.unsplash.com/photo-1585079542156-2755d9c8a094?auto=format&fit=crop&w=900&q=80'
    ],
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
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
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
  },
  {
    name: 'ASUS ROG Swift PG27AQDM 27" OLED',
    description: '27 inç QHD 240Hz OLED oyuncu monitörü. 0.03 ms tepki süresi ve G-Sync uyumlu.',
    category: 'Bilgisayar',
    subcategory: 'Monitör',
    brand: 'ASUS',
    model: 'ROG Swift PG27AQDM',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Ekran Boyutu', value: '27', category: 'Görüntü', unit: 'inç' },
      { name: 'Çözünürlük', value: '2560x1440', category: 'Görüntü' },
      { name: 'Yenileme Hızı', value: '240', category: 'Görüntü', unit: 'Hz' },
      { name: 'Panel', value: 'OLED', category: 'Görüntü' },
      { name: 'Tepki Süresi', value: '0.03', category: 'Performans', unit: 'ms' }
    ],
    prices: [
      { siteName: 'incehesap', price: 38999, url: 'https://www.incehesap.com/asus-rog-swift-pg27aqdm-monitör-fiyati-67897', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 39499, url: 'https://www.akakce.com/monitor/en-ucuz-asus-rog-swift-pg27aqdm-fiyati,1500.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.9,
    reviewCount: 742
  },
  {
    name: 'Kingston Fury Beast 32GB (2x16) DDR5 6000MHz CL36',
    description: 'Yüksek hızlı DDR5 bellek kiti. XMP destekli, CL36 gecikme.',
    category: 'Bilgisayar',
    subcategory: 'RAM',
    brand: 'Kingston',
    model: 'Fury Beast DDR5 6000',
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Kapasite', value: '32', category: 'Bellek', unit: 'GB' },
      { name: 'Kanal', value: '2x16', category: 'Bellek' },
      { name: 'Frekans', value: '6000', category: 'Performans', unit: 'MHz' },
      { name: 'Gecikme', value: 'CL36', category: 'Performans' },
      { name: 'Tip', value: 'DDR5', category: 'Bellek' }
    ],
    prices: [
      { siteName: 'incehesap', price: 2999, url: 'https://www.incehesap.com/kingston-fury-beast-32gb-ddr5-6000mhz-fiyati-12345', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 3149, url: 'https://www.akakce.com/ram/en-ucuz-kingston-fury-beast-32gb-ddr5-6000-fiyati,1600.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.7,
    reviewCount: 368
  },
  {
    name: 'Corsair RM850x Shift 850W 80+ Gold',
    description: 'Modüler, sessiz ve yüksek verimli PSU. Yan bağlantı konnektörlü yeni nesil tasarım.',
    category: 'Bilgisayar',
    subcategory: 'Güç Kaynağı',
    brand: 'Corsair',
    model: 'RM850x Shift',
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Güç', value: '850', category: 'Güç', unit: 'W' },
      { name: 'Sertifika', value: '80+ Gold', category: 'Güç' },
      { name: 'Modüler', value: 'Tam modüler', category: 'Özellik' },
      { name: 'Fan', value: '140mm', category: 'Soğutma', unit: 'mm' }
    ],
    prices: [
      { siteName: 'incehesap', price: 4299, url: 'https://www.incehesap.com/corsair-rm850x-shift-psu-fiyati-22334', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 4499, url: 'https://www.akakce.com/psu/en-ucuz-corsair-rm850x-shift-fiyati,1700.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.8,
    reviewCount: 512
  },
  {
    name: 'Logitech MX Master 3S',
    description: 'Ergonomik kablosuz mouse, 8K DPI, sessiz tıklama, Flow desteği.',
    category: 'Bilgisayar',
    subcategory: 'Mouse',
    brand: 'Logitech',
    model: 'MX Master 3S',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'DPI', value: '8000', category: 'Performans', unit: 'DPI' },
      { name: 'Bağlantı', value: 'Bluetooth / Logi Bolt', category: 'Bağlantı' },
      { name: 'Şarj', value: 'USB-C', category: 'Güç' },
      { name: 'Ağırlık', value: '141', category: 'Fiziksel', unit: 'g' }
    ],
    prices: [
      { siteName: 'incehesap', price: 2899, url: 'https://www.incehesap.com/logitech-mx-master-3s-fiyati-33445', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 2999, url: 'https://www.akakce.com/fare-mouse/en-ucuz-logitech-mx-master-3s-fiyati,1800.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.9,
    reviewCount: 2147
  },
  {
    name: 'ASUS ROG Strix Z890-E Gaming WiFi',
    description: 'Intel LGA1851 soket, DDR5 destekli, PCIe 5.0, WiFi 7, USB 3.2 Gen 2x2 Type-C.',
    category: 'Bilgisayar',
    subcategory: 'Anakart',
    brand: 'ASUS',
    model: 'ROG Strix Z890-E',
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Soket', value: 'LGA1851', category: 'Donanım' },
      { name: 'Bellek', value: 'DDR5', category: 'Donanım' },
      { name: 'PCIe', value: '5.0', category: 'Donanım' },
      { name: 'WiFi', value: '7', category: 'Bağlantı' },
      { name: 'Form Faktör', value: 'ATX', category: 'Fiziksel' }
    ],
    prices: [
      { siteName: 'incehesap', price: 9899, url: 'https://www.incehesap.com/asus-rog-strix-z890-e-fiyati-55667', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 10199, url: 'https://www.akakce.com/anakart/en-ucuz-asus-rog-strix-z890-e-fiyati,1900.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.8,
    reviewCount: 687
  },
  {
    name: 'Noctua NH-D15 Chromax.Black',
    description: 'Yüksek performanslı hava soğutucusu, iki adet 140mm fan, neredeyse sessiz çalışma.',
    category: 'Bilgisayar',
    subcategory: 'CPU Soğutucu',
    brand: 'Noctua',
    model: 'NH-D15 Chromax',
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Tip', value: 'Hava Soğutucu', category: 'Soğutma' },
      { name: 'Fanlar', value: '2x 140mm', category: 'Soğutma', unit: 'mm' },
      { name: 'TDP', value: '250', category: 'Performans', unit: 'W' },
      { name: 'Renk', value: 'Siyah', category: 'Görüntü' },
      { name: 'Gürültü', value: '14.6 dB', category: 'Ses', unit: 'dB' }
    ],
    prices: [
      { siteName: 'incehesap', price: 3499, url: 'https://www.incehesap.com/noctua-nh-d15-chromax-fiyati-66778', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 3699, url: 'https://www.akakce.com/sogutucu/en-ucuz-noctua-nh-d15-chromax-fiyati,2000.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.9,
    reviewCount: 1024
  },
  {
    name: 'Corsair iCUE 4000 Airflow RGB Case',
    description: 'Gelişmiş hava akışı, RGB aydınlatma, çok fan montajı, temperli cam panel.',
    category: 'Bilgisayar',
    subcategory: 'Kasa',
    brand: 'Corsair',
    model: 'iCUE 4000 Airflow',
    images: [
      'https://images.unsplash.com/photo-1587202372775-98927c89fd87?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Form Faktör', value: 'Mid Tower', category: 'Fiziksel' },
      { name: 'Materyal', value: 'Alüminyum / Çelik', category: 'Materyal' },
      { name: 'Fan Montajı', value: '6 adet 120mm', category: 'Soğutma', unit: 'mm' },
      { name: 'GPU Uzunluğu', value: '370mm', category: 'Uyumluluk', unit: 'mm' },
      { name: 'Aydınlatma', value: 'RGB', category: 'Özellik' }
    ],
    prices: [
      { siteName: 'incehesap', price: 3199, url: 'https://www.incehesap.com/corsair-icue-4000-airflow-fiyati-77889', inStock: true, lastUpdated: new Date() },
      { siteName: 'akakce', price: 3399, url: 'https://www.akakce.com/kasa/en-ucuz-corsair-icue-4000-airflow-fiyati,2100.html', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.7,
    reviewCount: 856
  },
  {
    name: 'Sony WH-1000XM5 Kablosuz Kulaklık',
    description: 'Sınıf en iyi gürültü iptal etme, 30 saatlik pil, premium ses kalitesi.',
    category: 'Elektronik',
    subcategory: 'Kulaklık',
    brand: 'Sony',
    model: 'WH-1000XM5',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Tür', value: 'Kablosuz', category: 'Bağlantı' },
      { name: 'Gürültü İptali', value: 'Evet', category: 'Özellik' },
      { name: 'Pil Ömrü', value: '30 saat', category: 'Pil', unit: 'saat' },
      { name: 'Bluetooth', value: '5.3', category: 'Bağlantı' },
      { name: 'Ağırlık', value: '250g', category: 'Fiziksel', unit: 'g' }
    ],
    prices: [
      { siteName: 'Sony Mağazası', price: 11999, url: 'https://sony.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Hepsiburada', price: 12499, url: 'https://hepsiburada.com', inStock: true, lastUpdated: new Date() },
      { siteName: 'Trendyol', price: 12299, url: 'https://trendyol.com', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.9,
    reviewCount: 3456
  },
  {
    name: 'DJI Air 3S Drone',
    description: '48MP kamera, 46 dakika uçuş süresi, 8km menzil, 4K video.',
    category: 'Hobi',
    subcategory: 'Drone',
    brand: 'DJI',
    model: 'Air 3S',
    images: [
      'https://images.unsplash.com/photo-1579290328254-c1e5fa3c8eab?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Kamera', value: '48MP', category: 'Görüntü', unit: 'MP' },
      { name: 'Video', value: '4K', category: 'Görüntü' },
      { name: 'Uçuş Süresi', value: '46 dakika', category: 'Performans', unit: 'dakika' },
      { name: 'Menzil', value: '8km', category: 'Performans', unit: 'km' },
      { name: 'Ağırlık', value: '738g', category: 'Fiziksel', unit: 'g' }
    ],
    prices: [
      { siteName: 'DJI Resmi Mağazası', price: 64999, url: 'https://dji.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Teknosa', price: 67499, url: 'https://teknosa.com', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.8,
    reviewCount: 745
  },
  {
    name: 'FujiFilm Instax Mini Evo',
    description: 'Anlık film kamerası, RGB LED flaş, çeşitli lens efektleri, bluetooth bağlantı.',
    category: 'Hobi',
    subcategory: 'Kamera',
    brand: 'Fujifilm',
    model: 'Instax Mini Evo',
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80'
    ],
    specifications: [
      { name: 'Film Boyutu', value: 'Instax Mini', category: 'Fiziksel' },
      { name: 'Lens Efekti', value: '10 farklı', category: 'Özellik' },
      { name: 'Flaş', value: 'RGB LED', category: 'Işık' },
      { name: 'Bluetooth', value: 'Evet', category: 'Bağlantı' },
      { name: 'Ağırlık', value: '307g', category: 'Fiziksel', unit: 'g' }
    ],
    prices: [
      { siteName: 'Amazon', price: 5499, url: 'https://amazon.com.tr', inStock: true, lastUpdated: new Date() },
      { siteName: 'Hepsiburada', price: 5799, url: 'https://hepsiburada.com', inStock: true, lastUpdated: new Date() }
    ],
    rating: 4.6,
    reviewCount: 892
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
