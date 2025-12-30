# 🛍️ Wellibuy - Akıllı E-Ticaret Platformu

<div align="center">

![Wellibuy Logo](https://via.placeholder.com/150x150/0ea5e9/ffffff?text=W)

**Yapay Zeka Destekli Bilinçli Alışveriş Deneyimi**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.4-green)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple)](https://openai.com/)

</div>

---

## ⚡ Hızlı Başlangıç (3 Dakika!)

```powershell
# 1. Bağımlılıkları yükle
npm install

# 2. Otomatik kurulum ve başlatma
npm run setup
```

✅ Bu kadar! Tarayıcınızda http://localhost:3000 açılacak.

> **Not:** MongoDB ve OpenAI API key gereklidir. Detaylı kurulum için [KURULUM.md](./KURULUM.md) dosyasına bakın.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Proje Yapısı](#-proje-yapısı)
- [API Dökümanları](#-api-dökümanları)
- [Özellik Detayları](#-özellik-detayları)

---

## ✨ Özellikler

### 🤖 Yapay Zeka Destekli Sistem

- **AI Asistan**: 7/24 akıllı alışveriş danışmanı
- **Kamera ile Ürün Tarama**: Mobil kamera ile ürün analizi
- **Gıda İçerik Analizi**: Yararlı/zararlı/şüpheli madde tespiti
- **PC Builder AI**: Bütçe ve kullanım alanına göre bilgisayar konfigürasyonu
- **Akıllı Arama**: Doğal dil ile ürün arama

### 💰 Fiyat Karşılaştırma

- Tüm e-ticaret sitelerinden fiyat toplama
- Gerçek zamanlı fiyat güncellemeleri
- En ucuz seçeneği otomatik bulma
- Fiyat geçmişi ve trend analizi

### 🔍 Gelişmiş Arama ve Filtreleme

- Minimum 2 özellik ile çok katmanlı filtreleme
- Kategori bazlı arama
- Özellik kombinasyonu ile ürün listeleme
- AI destekli akıllı öneri sistemi

### 📱 %100 Mobil Uyumluluk

- Responsive tasarım
- Touch-friendly arayüz
- Mobil kamera entegrasyonu
- Progressive Web App (PWA) desteği

---

## 🛠 Teknoloji Stack

### Frontend
- **Next.js 14**: React framework (SSR, SSG)
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Modern ve hızlı styling
- **Framer Motion**: Animasyonlar
- **Lucide Icons**: Güzel ikonlar

### Backend
- **Node.js + Express**: RESTful API
- **MongoDB + Mongoose**: NoSQL veritabanı
- **OpenAI API**: Yapay zeka servisleri

### Diğer
- **Axios**: HTTP istekleri
- **Zod**: Veri validasyonu
- **React Webcam**: Kamera entegrasyonu

---

## 🚀 Kurulum

### Gereksinimler

- Node.js (v18+)
- MongoDB (yerel veya Atlas)
- OpenAI API anahtarı

### Adım 1: Projeyi İndirin

```bash
git clone https://github.com/wellibuy/wellibuy-ai.git
cd wellibuy-ai
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
npm install
```

### Adım 3: Çevresel Değişkenleri Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
copy .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/wellibuy

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Server
PORT=5000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Adım 4: MongoDB'yi Başlatın

Windows'ta MongoDB servisini başlatın:

```powershell
net start MongoDB
```

Veya MongoDB Atlas kullanıyorsanız connection string'i `.env` dosyasına ekleyin.

### Adım 5: Backend Sunucusunu Başlatın

```bash
npm run server
```

Sunucu http://localhost:5000 adresinde çalışacak.

### Adım 6: Frontend'i Başlatın

Yeni bir terminal açın:

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde açılacak.

---

## 📚 Kullanım

### Ana Sayfa

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Arama çubuğundan ürün arayın veya AI'ya soru sorun
3. Kategorileri keşfedin

### Ürün Arama

**Normal Arama:**
```
NVIDIA RTX 5090
```

**AI Arama (Doğal Dil):**
```
30.000 liraya oyun bilgisayarı toplamak istiyorum
```

### PC Builder Kullanımı

1. "PC Kur" butonuna tıklayın
2. Bütçenizi girin (örn: 30.000 TL)
3. Kullanım amacını seçin (Oyun/İş/Grafik)
4. AI size en iyi konfigürasyonu önerecek

### Mobil Kamera ile Ürün Tarama

1. Mobil cihazınızdan siteye girin
2. Kamera ikonuna tıklayın
3. Ürünün barkodunu veya etiketini tarayın
4. AI ürünü analiz edip öneride bulunacak

---

## 📁 Proje Yapısı

```
wellibuy-ai/
├── app/                      # Next.js 14 App Router
│   ├── globals.css          # Global stiller
│   ├── layout.tsx           # Ana layout
│   └── page.tsx             # Ana sayfa
├── components/              # React bileşenleri
│   ├── layout/              # Layout bileşenleri
│   │   ├── Header.tsx       # Üst menü
│   │   └── Footer.tsx       # Alt bilgi
│   ├── home/                # Ana sayfa bileşenleri
│   │   ├── Hero.tsx         # Hero bölümü
│   │   ├── Categories.tsx   # Kategoriler
│   │   ├── Features.tsx     # Özellikler
│   │   └── ...
│   └── search/              # Arama bileşenleri
│       └── SearchBar.tsx    # Arama çubuğu
├── server/                  # Backend (Express)
│   ├── index.js             # Ana sunucu dosyası
│   └── routes/              # API route'ları
│       ├── products.js      # Ürün API'ları
│       ├── ai.js            # AI API'ları
│       └── categories.js    # Kategori API'ları
├── lib/                     # Yardımcı fonksiyonlar
│   ├── database.ts          # MongoDB bağlantısı
│   └── ai-service.ts        # AI servisleri
├── models/                  # Veritabanı modelleri
│   └── Product.ts           # Ürün modeli
├── types/                   # TypeScript tip tanımları
│   └── index.ts             # Tüm tipler
└── README.md                # Bu dosya
```

---

## 🌐 API Dökümanları

### Ürün API'ları

#### Tüm Ürünleri Listele
```http
GET /api/products?page=1&limit=20&category=Bilgisayar
```

#### Ürün Ara ve Filtrele
```http
GET /api/products/search?q=rtx&minPrice=10000&maxPrice=50000&specifications={"İşlemci":["Intel i9"]}
```

#### Ürün Detayı
```http
GET /api/products/:id
```

### AI API'ları

#### AI Ürün Önerileri
```http
POST /api/ai/recommendations
Content-Type: application/json

{
  "category": "Bilgisayar",
  "priceRange": { "min": 20000, "max": 30000 },
  "purpose": "oyun"
}
```

#### PC Builder
```http
POST /api/ai/pc-builder
Content-Type: application/json

{
  "budget": 30000,
  "purpose": "oyun",
  "games": ["Cyberpunk 2077", "GTA 6"]
}
```

#### Kamera ile Ürün Tarama
```http
POST /api/ai/scan-product
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

#### İçindekiler Analizi
```http
POST /api/ai/ingredients
Content-Type: application/json

{
  "productName": "Çikolata",
  "ingredients": ["Şeker", "Kakao", "Süt tozu", "E471"]
}
```

---

## 🎯 Özellik Detayları

### 1. Gelişmiş Filtreleme Sistemi

Kullanıcı **en az 2 özellik** seçerek ürün araması yapabilir:

**Örnek:**
- İşlemci: Intel i9
- RAM: 32GB
- Ekran Kartı: RTX 4090

Sistem bu **3 özelliğin hepsini birden** içeren ürünleri listeler.

### 2. Gıda İçerik Analizi

AI her gıda maddesini analiz eder:

- ✅ **Yararlı**: Vitamin, protein, kalsiyum vb.
- ⚠️ **Şüpheli**: Daha fazla araştırma gerekli
- ❌ **Zararlı**: Aspartam, MSG, trans yağ vb.

### 3. PC Builder Algoritması

1. Kullanıcı bütçe girer
2. Kullanım amacını seçer (oyun/iş/grafik)
3. AI şunları yapar:
   - Bütçeyi parçalara böler (İşlemci %25, GPU %45 vb.)
   - En iyi fiyat-performans parçaları seçer
   - Uyumluluk kontrol eder
   - Oyun performansı tahmin eder

### 4. Mobil Kamera Entegrasyonu

- Kamera açılır
- Ürün görseli yakalanır
- Base64'e çevrilir
- OpenAI Vision API'ye gönderilir
- AI ürünü tanır ve analiz eder

---

## 🎨 Tasarım Prensipleri

### Sadelik
- Karmaşık menüler yok
- Net ve anlaşılır butonlar
- Kolay navigasyon

### Görsel Kalite
- Modern gradient'ler
- Smooth animasyonlar
- Profesyonel renkler

### Mobil Öncelik
- Touch-friendly butonlar (min 44px)
- Responsive grid sistemleri
- Hızlı yükleme

---

## 🔐 Güvenlik

- CORS koruması
- Input validasyonu (Zod)
- MongoDB injection koruması
- API rate limiting
- Secure headers

---

## 📈 Performans

- Next.js SSR/SSG optimizasyonu
- Image optimization
- Code splitting
- Lazy loading
- MongoDB indexing

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'feat: add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje MIT lisansı altındadır.

---

## 👨‍💻 Geliştirici

**Wellibuy Team**

- Email: info@wellibuy.com
- Web: https://wellibuy.com

---

## 🙏 Teşekkürler

- OpenAI - GPT-4 API
- MongoDB - Veritabanı
- Next.js - React Framework
- Tailwind CSS - Styling

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by Wellibuy

</div>
