/**
 * TEST ve KONTROL SCRİPTİ
 * 
 * Projenin kurulum durumunu kontrol eder
 * node scripts/check-setup.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Wellibuy Kurulum Kontrolü\n');
console.log('=' .repeat(50));

let allGood = true;

// 1. Node modüllerini kontrol et
console.log('\n[1] Node Modülleri');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules mevcut');
} else {
  console.log('  ❌ node_modules bulunamadı');
  console.log('     → npm install çalıştırın');
  allGood = false;
}

// 2. .env dosyasını kontrol et
console.log('\n[2] Çevresel Değişkenler');
if (fs.existsSync('.env')) {
  console.log('  ✅ .env dosyası mevcut');
  
  // Zorunlu değişkenleri kontrol et
  const required = ['MONGODB_URI', 'PORT'];
  const optional = ['OPENAI_API_KEY'];
  
  required.forEach(key => {
    if (process.env[key]) {
      console.log(`  ✅ ${key} tanımlı`);
    } else {
      console.log(`  ❌ ${key} eksik`);
      allGood = false;
    }
  });
  
  optional.forEach(key => {
    if (process.env[key]) {
      console.log(`  ✅ ${key} tanımlı (AI özellikleri aktif)`);
    } else {
      console.log(`  ⚠️  ${key} eksik (AI özellikleri çalışmayacak)`);
    }
  });
} else {
  console.log('  ❌ .env dosyası bulunamadı');
  console.log('     → .env.example dosyasını .env olarak kopyalayın');
  allGood = false;
}

// 3. Gerekli dosyaları kontrol et
console.log('\n[3] Proje Dosyaları');
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'server/index.js',
  'app/page.tsx',
  'app/layout.tsx'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} eksik`);
    allGood = false;
  }
});

// 4. MongoDB bağlantısı test et
console.log('\n[4] MongoDB Bağlantısı');
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('  ✅ MongoDB bağlantısı başarılı');
      return mongoose.connection.db.admin().listDatabases();
    })
    .then((result) => {
      const wellibuyDb = result.databases.find(db => db.name === 'wellibuy');
      if (wellibuyDb) {
        console.log('  ✅ wellibuy veritabanı mevcut');
      } else {
        console.log('  ⚠️  wellibuy veritabanı henüz yok (ilk çalıştırmada oluşacak)');
      }
      mongoose.connection.close();
      printSummary();
    })
    .catch((error) => {
      console.log('  ❌ MongoDB bağlantısı başarısız');
      console.log(`     ${error.message}`);
      mongoose.connection.close();
      allGood = false;
      printSummary();
    });
} else {
  console.log('  ❌ MONGODB_URI tanımlı değil');
  allGood = false;
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Özet\n');
  
  if (allGood) {
    console.log('🎉 Tüm kontroller başarılı!');
    console.log('\nProjeyi başlatmak için:');
    console.log('  1. npm run server  (Backend)');
    console.log('  2. npm run dev     (Frontend)');
    console.log('\nVeya otomatik:');
    console.log('  npm run setup');
  } else {
    console.log('⚠️  Bazı problemler var!');
    console.log('\nYukarıdaki ❌ işaretli sorunları düzeltin.');
    console.log('Detaylı kurulum için: KURULUM.md');
  }
  
  console.log('\n');
  process.exit(allGood ? 0 : 1);
}
