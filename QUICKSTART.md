# ⚡ HIZLI BAŞLANGIÇ

## 🚀 Tek Komutla Başlat

```powershell
npm run setup
```

Bu komut:
1. ✅ Bağımlılıkları yükler
2. ✅ .env dosyasını oluşturur  
3. ✅ MongoDB'yi kontrol eder
4. ✅ Örnek verileri yükler
5. ✅ Sunucuları başlatır

---

## 📋 Ön Gereksinimler

### Zorunlu
- [Node.js](https://nodejs.org/) v18+ ✅
- [MongoDB](https://www.mongodb.com/try/download/community) (Yerel) veya [Atlas](https://www.mongodb.com/cloud/atlas) (Cloud) ✅

### Opsiyonel (AI özellikleri için)
- [OpenAI API Key](https://platform.openai.com/api-keys) 🤖

---

## 🔧 Manuel Kurulum (5 Dakika)

### 1. Bağımlılıkları Yükle
```powershell
npm install
```

### 2. Çevresel Değişkenleri Ayarla
```powershell
copy .env.example .env
```

`.env` dosyasını düzenle:
```env
MONGODB_URI=mongodb://localhost:27017/wellibuy
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=5000
```

### 3. MongoDB Başlat
```powershell
net start MongoDB
```

### 4. Örnek Verileri Yükle
```powershell
npm run seed
```

### 5. Sunucuları Başlat

**Terminal 1 - Backend:**
```powershell
npm run server
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

---

## 🌐 Erişim

- 🎨 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:5000/api
- 📊 **API Health:** http://localhost:5000/api/health

---

## 🎯 Test Et

1. **Arama Yap:** Ana sayfada "RTX 5090" ara
2. **AI Arama:** AI butonunu aktif edip "30 bin liraya oyun bilgisayarı" yaz
3. **PC Builder:** http://localhost:3000/pc-builder sayfasını ziyaret et
4. **Ürün Detay:** Herhangi bir ürüne tıkla

---

## 📚 Daha Fazla Bilgi

- 📖 [Detaylı Kurulum Kılavuzu](./KURULUM.md)
- 📊 [Proje Durumu](./STATUS.md)
- 🎓 [API Dökümanları](./README.md#-api-dökümanları)

---

## 🆘 Sorun mu Yaşıyorsun?

### "Cannot find module"
```powershell
rm -r node_modules
npm install
```

### "MongoDB connection failed"
```powershell
net start MongoDB
# veya .env'de Atlas connection string kullan
```

### "Port already in use"
```powershell
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

## 🎉 Başarılı!

Herşey çalışıyorsa şunları göreceksin:

✅ MongoDB bağlantısı başarılı  
✅ Backend çalışıyor (port 5000)  
✅ Frontend çalışıyor (port 3000)  
✅ 6 örnek ürün yüklendi  
✅ Güzel bir ana sayfa görüyorsun  

---

**İyi Kodlamalar! 🚀**
