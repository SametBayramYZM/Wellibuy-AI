# 🧪 Wellibuy Test Kılavuzu

## Kurulum Sonrası Testler

### 1. Kurulum Kontrolü
```bash
npm run check
```
Bu komut tüm kurulumu otomatik kontrol eder.

### 2. Backend Test
```bash
# Terminal 1'de
npm run server
```

Kontrol edilecekler:
- ✅ "MongoDB Connected!" mesajı
- ✅ "Server running on http://localhost:5000"
- ✅ Hiçbir hata mesajı yok

### 3. Frontend Test
```bash
# Terminal 2'de
npm run dev
```

Kontrol edilecekler:
- ✅ "ready - started server on http://localhost:3000"
- ✅ "compiled client and server successfully"

### 4. Manuel API Testleri

#### a) Health Check
```bash
curl http://localhost:5000/api/health
```
Beklenen: `{"status":"ok","message":"Server is running"}`

#### b) Ürünleri Listele
```bash
curl http://localhost:5000/api/products
```
Beklenen: Ürün listesi JSON formatında

#### c) Kategorileri Listele
```bash
curl http://localhost:5000/api/categories
```
Beklenen: Kategori listesi

### 5. Tarayıcıda UI Testleri

http://localhost:3000 adresine git:

#### Ana Sayfa Testleri
- [ ] Header görünüyor (logo, arama, menü)
- [ ] Hero bölümü animasyonlu şekilde yükleniyor
- [ ] Kategori kartları (6 adet) görünüyor
- [ ] Özellikler bölümü 6 kart içeriyor
- [ ] Footer sosyal medya linkleri var

#### Arama Testleri
- [ ] Arama çubuğuna "RTX 5090" yaz → Enter
- [ ] Sonuç sayfasına yönlendiriyor
- [ ] AI arama toggle çalışıyor (Sparkles ikonu)
- [ ] Öneriler dropdown açılıyor

#### Kategori Testleri
- [ ] Bir kategoriye tıkla (örn. Elektronik)
- [ ] Kategori sayfası `/categories/elektronik` açılıyor
- [ ] Ürünler grid halinde gösteriliyor

#### Ürün Detay Testleri
- [ ] Bir ürüne tıkla
- [ ] Detay sayfası `/products/[id]` açılıyor
- [ ] Ürün görselleri var
- [ ] Fiyat karşılaştırma tablosu gösteriliyor
- [ ] Özellikler grid halinde
- [ ] Gıda ürünlerinde içerik analizi var (yararlı/zararlı/şüpheli)

#### PC Builder Testleri
- [ ] `/pc-builder` sayfasına git
- [ ] Bütçe kaydırıcısı çalışıyor
- [ ] Amaç seçimi (oyun/iş/grafik/genel) var
- [ ] Oyun checkboxları seçiliyor
- [ ] "Bilgisayarımı Oluştur" butonu çalışıyor
- [ ] Sonuç bileşenleri gösteriliyor
- [ ] FPS tahminleri var

#### Gelişmiş Filtreleme Testleri
- [ ] Arama sayfasında filtreler açılıyor
- [ ] En az 2 özellik seçmeden arama yapılamıyor
- [ ] Fiyat aralığı filtresi çalışıyor
- [ ] Puan filtresi çalışıyor
- [ ] Kategori filtresi çalışıyor

### 6. Mobil Responsive Testleri

Tarayıcıda F12 → Device Toolbar (Ctrl+Shift+M)

#### iPhone 12 Pro (390x844)
- [ ] Hamburger menü görünüyor
- [ ] Menü açılıp kapanıyor
- [ ] Kartlar dikey diziliyor
- [ ] Tüm butonlar dokunulabilir (min 44px)
- [ ] Footer mobil layouta geçiyor

#### iPad (768x1024)
- [ ] Tablet layout aktif
- [ ] 2 sütunlu grid
- [ ] Navigation tam görünüyor

### 7. AI Özellikleri Testleri

(OpenAI API key gerekli)

#### İçerik Analizi
- [ ] Gıda ürününe git (Ülker Gofret veya Coca Cola)
- [ ] İçerik analizi bölümünde renkli badge'ler var
- [ ] Yararlı = Yeşil, Şüpheli = Sarı, Zararlı = Kırmızı
- [ ] Her madde için sağlık skoru (1-10) gösteriliyor

#### Akıllı Arama
- [ ] Arama kutusunda AI toggle'ı aç
- [ ] "Oyun oynamak için 50 bin lira bütçeli bilgisayar" yaz
- [ ] Doğal dil işleme çalışıyor
- [ ] İlgili ürünler gösteriliyor

#### Kamera Tarama
(Altyapı hazır, gerçek camera entegrasyonu yapılacak)
- [ ] Ürün detayında "Kamera ile Tara" butonu var
- [ ] Tıklandığında kamera izni istiyor (mock)

### 8. Performans Testleri

#### Lighthouse Skoru (Chrome DevTools)
- [ ] Performance: >90
- [ ] Accessibility: >90
- [ ] Best Practices: >90
- [ ] SEO: >90

#### Sayfa Yükleme Süreleri
- [ ] Ana sayfa: <2 saniye
- [ ] Arama sonuçları: <1.5 saniye
- [ ] Ürün detayı: <2 saniye

### 9. Veritabanı Testleri

MongoDB Compass'ta veya mongosh ile:

```bash
mongosh
use wellibuy
db.products.countDocuments()
```

Beklenen: 6 ürün (seed çalıştırıldıysa)

```bash
db.products.find().pretty()
```

Kontrol:
- [ ] Tüm ürünler doğru formatta
- [ ] specifications alanları dolu
- [ ] priceComparison en az 3 satıcı
- [ ] ingredients gıda ürünlerinde var

### 10. Hata Durumları Testleri

#### MongoDB Bağlantı Hatası
- [ ] MongoDB'yi kapat
- [ ] Backend'i başlat
- [ ] Hata mesajı net ve anlaşılır

#### OpenAI API Hatası
- [ ] OPENAI_API_KEY'i sil veya yanlış yap
- [ ] AI özelliği kullan
- [ ] Fallback mock data gösteriliyor
- [ ] Kullanıcı uyarı mesajı görüyor

#### 404 Sayfa
- [ ] `/yanlis-sayfa` git
- [ ] Next.js 404 sayfası görünüyor

#### Boş Arama
- [ ] Arama kutusuna hiçbir şey yazmadan ara
- [ ] "Lütfen bir arama terimi girin" uyarısı

## ✅ Tüm Testler Başarılı mı?

Eğer tüm checkboxlar işaretliyse, Wellibuy tam çalışır durumda! 🎉

## 🐛 Sorun mu Var?

1. **Kontrol Et**: `npm run check` çalıştır
2. **Logları İncele**: Terminal ve tarayıcı console'a bak
3. **Dokümantasyon**: KURULUM.md ve QUICKSTART.md'ye göz at
4. **Temiz Başlat**: 
   ```bash
   rm -rf node_modules .next
   npm install
   npm run setup
   ```

## 📝 Test Raporu Şablonu

```markdown
# Test Raporu - [Tarih]

## Sistem Bilgileri
- OS: Windows 11
- Node: v18.x
- MongoDB: v6.x
- Tarayıcı: Chrome v120

## Test Sonuçları
- [✅/❌] Kurulum Kontrolü
- [✅/❌] Backend Başlatma
- [✅/❌] Frontend Başlatma
- [✅/❌] UI Testleri (20/20)
- [✅/❌] Mobil Responsive (6/6)
- [✅/❌] AI Özellikleri (4/4)
- [✅/❌] Performans (>90 skor)

## Sorunlar
1. [Sorun açıklaması]
   - Çözüm: [...]

## Notlar
[Ek gözlemler]
```
