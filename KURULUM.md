# 🚀 WELLIBUY.COM - HIZLI BAŞLANGIÇ KILAVUZU

## ⚡ Otomatik Kurulum (Önerilen)

### Windows PowerShell ile Tek Komutta Kurulum

1. PowerShell'i **Yönetici olarak** açın
2. Proje klasörüne gidin:
   ```powershell
   cd C:\Users\Welli\Desktop\WellibuyAI
   ```
3. Kurulum scriptini çalıştırın:
   ```powershell
   npm run setup
   ```

Script şunları yapacak:
- ✅ Bağımlılıkları yükler
- ✅ .env dosyasını oluşturur
- ✅ MongoDB'yi kontrol eder
- ✅ Örnek verileri yükler
- ✅ Backend ve Frontend'i başlatır

---

## 🔧 Manuel Kurulum

### 1. Bağımlılıkları Yükleyin

```powershell
npm install
```

### 2. Çevresel Değişkenleri Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın:

```powershell
copy .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# MongoDB - Yerel veya Atlas
MONGODB_URI=mongodb://localhost:27017/wellibuy

# OpenAI API Anahtarı
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sunucu Portu
PORT=5000
NODE_ENV=development

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. MongoDB'yi Başlatın

**Seçenek A: Yerel MongoDB**
```powershell
net start MongoDB
```

**Seçenek B: MongoDB Atlas (Cloud)**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
- Cluster oluşturun
- Connection string'i `.env` dosyasına ekleyin

### 4. Örnek Verileri Yükleyin

```powershell
npm run seed
```

Bu komut veritabanına 6 örnek ürün ekler:
- NVIDIA RTX 5090
- MacBook Pro M5
- Ülker Gofret
- Coca Cola Zero
- Intel i9 İşlemci
- Samsung SSD

### 5. Backend Sunucusunu Başlatın

Yeni bir terminal açın:

```powershell
npm run server
```

✅ Backend http://localhost:5000 adresinde çalışacak

### 6. Frontend'i Başlatın

Ana terminalde:

```powershell
npm run dev
```

✅ Frontend http://localhost:3000 adresinde çalışacak

---

## 🌐 Tarayıcıda Açın

1. **Ana Sayfa**: http://localhost:3000
2. **API Durumu**: http://localhost:5000/api/health
3. **API Dökümanı**: http://localhost:5000/api

---

## 🧪 Test Edin

### Arama Yapın
1. Ana sayfadaki arama çubuğuna "RTX 5090" yazın
2. Enter'a basın
3. Sonuçları görün

### AI Arama Yapın
1. Arama çubuğunda AI butonunu aktif edin (⚡)
2. "30 bin liraya oyun bilgisayarı istiyorum" yazın
3. AI aramanızı analiz edecek

### PC Builder Kullanın
1. http://localhost:3000/pc-builder sayfasına gidin
2. Bütçenizi girin (örn: 30000)
3. Kullanım amacını seçin (Oyun)
4. Oyunları seçin
5. "Konfigürasyon Oluştur" butonuna tıklayın

---

## 🐛 Sorun Giderme

### "Cannot find module" Hatası

```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### MongoDB Bağlanamıyor

1. MongoDB servisini kontrol edin:
   ```powershell
   net start MongoDB
   ```

2. Veya MongoDB Atlas kullanın:
   - Connection string'i `.env` dosyasına ekleyin
   - IP adresinizi whitelist'e ekleyin

### Port Zaten Kullanımda

**3000 portu:**
```powershell
# Süreci bulun
netstat -ano | findstr :3000
# Sonuç: TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING 1234

# Süreci sonlandırın
taskkill /PID 1234 /F
```

**5000 portu:**
```powershell
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

### OpenAI API Hatası

1. API anahtarınızı kontrol edin: https://platform.openai.com/api-keys
2. `.env` dosyasında düzgün ayarlandığından emin olun
3. Bakiye kontrolü yapın

---

## 📚 Önemli Komutlar

```powershell
# Geliştirme modu
npm run dev              # Frontend başlat
npm run server           # Backend başlat

# Veritabanı
npm run seed             # Örnek verileri yükle

# Otomatik kurulum
npm run setup            # Tümünü otomatik kur ve başlat

# Build
npm run build            # Production build
npm start                # Production'da çalıştır

# Linting
npm run lint             # Kod kontrolü
```

---

## 🎯 Proje Sayfaları

### Mevcut Sayfalar
- ✅ **/** - Ana sayfa
- ✅ **/search** - Arama sonuçları
- ✅ **/pc-builder** - PC konfigürasyon oluşturucu

### Gelecek Sayfalar
- 🔜 **/products/[id]** - Ürün detay sayfası
- 🔜 **/categories/[name]** - Kategori sayfası
- 🔜 **/ai-assistant** - AI asistan
- 🔜 **/camera-scan** - Kamera ile ürün tarama

---

## 💡 İpuçları

1. **Geliştirme Sırasında:**
   - Hot reload aktif, dosyaları kaydettiğinizde otomatik güncellenir
   - Console log'ları terminal'de görünür
   - Error'lar tarayıcıda overlay olarak gösterilir

2. **API Testi:**
   - Postman veya Thunder Client kullanabilirsiniz
   - http://localhost:5000/api endpoint'ini test edin

3. **Veritabanı Görüntüleme:**
   - MongoDB Compass kullanın
   - Connection string: `mongodb://localhost:27017`
   - Database: `wellibuy`

---

## 📞 Destek

Sorun yaşarsanız:
1. Terminal'deki hata mesajlarını kontrol edin
2. `.env` dosyasını doğru ayarladığınızdan emin olun
3. MongoDB ve Node.js'in çalıştığını kontrol edin

---

## 🎉 Başarılı Kurulum

Herşey çalışıyorsa şunları göreceksiniz:

**Terminal 1 (Backend):**
```
╔═══════════════════════════════════════════╗
║   🚀 Wellibuy API Sunucusu Başlatıldı    ║
╠═══════════════════════════════════════════╣
║   Port: 5000                              ║
║   API: http://localhost:5000/api          ║
╚═══════════════════════════════════════════╝
✅ MongoDB bağlantısı başarılı
```

**Terminal 2 (Frontend):**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Tarayıcı:**
- Güzel bir ana sayfa
- Çalışan arama çubuğu
- Kategoriler
- Responsive tasarım

---

İyi çalışmalar! 🚀
