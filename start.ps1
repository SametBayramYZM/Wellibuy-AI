/**
 * KURULUM VE BAŞLATMA SCRİPTİ
 * 
 * Tüm projeyi otomatik kurar ve başlatır
 */

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    WELLIBUY.COM - KURULUM VE BAŞLATMA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node modüllerini kontrol et
Write-Host "[1/6] Node modülleri kontrol ediliyor..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Node modülleri bulunamadı. Yükleniyor..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "HATA: Node modülleri yüklenemedi!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node modülleri yüklendi" -ForegroundColor Green
} else {
    Write-Host "✓ Node modülleri mevcut" -ForegroundColor Green
}
Write-Host ""

# 2. .env dosyasını kontrol et
Write-Host "[2/6] Çevresel değişkenler kontrol ediliyor..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host ".env dosyası bulunamadı. .env.example'dan kopyalanıyor..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env dosyası oluşturuldu" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  UYARI: .env dosyasını düzenleyip API anahtarlarınızı ekleyin!" -ForegroundColor Yellow
    Write-Host "   - MONGODB_URI (MongoDB bağlantı adresi)" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY (OpenAI API anahtarı)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✓ .env dosyası mevcut" -ForegroundColor Green
}
Write-Host ""

# 3. MongoDB kontrolü
Write-Host "[3/6] MongoDB bağlantısı kontrol ediliyor..." -ForegroundColor Yellow
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if (!$mongoRunning) {
    Write-Host "⚠️  MongoDB çalışmıyor. Başlatılıyor..." -ForegroundColor Yellow
    try {
        net start MongoDB 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ MongoDB başlatıldı" -ForegroundColor Green
        } else {
            Write-Host "! MongoDB servisi bulunamadı. Manuel başlatın veya MongoDB Atlas kullanın." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "! MongoDB otomatik başlatılamadı. Manuel başlatın veya Atlas kullanın." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ MongoDB çalışıyor" -ForegroundColor Green
}
Write-Host ""

# 4. Örnek verileri yükle
Write-Host "[4/6] Örnek veriler yükleniyor..." -ForegroundColor Yellow
$loadData = Read-Host "Örnek ürünleri yüklemek ister misiniz? (E/H)"
if ($loadData -eq "E" -or $loadData -eq "e") {
    node scripts/seed-products.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Örnek veriler yüklendi" -ForegroundColor Green
    } else {
        Write-Host "! Örnek veriler yüklenemedi" -ForegroundColor Yellow
    }
} else {
    Write-Host "○ Örnek veriler atlandı" -ForegroundColor Gray
}
Write-Host ""

# 5. Backend sunucusunu başlat
Write-Host "[5/6] Backend sunucusu başlatılıyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server" -WindowStyle Normal
Write-Host "✓ Backend sunucusu başlatıldı (http://localhost:5000)" -ForegroundColor Green
Start-Sleep -Seconds 3
Write-Host ""

# 6. Frontend'i başlat
Write-Host "[6/6] Frontend başlatılıyor..." -ForegroundColor Yellow
Write-Host "✓ Frontend başlatıldı (http://localhost:3000)" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "           🎉 KURULUM TAMAMLANDI!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tarayıcınızda şu adresleri ziyaret edin:" -ForegroundColor White
Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Backend:   http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Durdurmak için Ctrl+C yapın." -ForegroundColor Gray
Write-Host ""

# Frontend'i başlat
npm run dev
