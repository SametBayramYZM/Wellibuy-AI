/**
 * YAPAY ZEKA API ROUTE'LARI
 * 
 * AI ile ilgili tüm endpoint'ler:
 * - Ürün önerileri
 * - PC Builder
 * - Kamera ile ürün tarama
 * - İçindekiler analizi
 * - Akıllı arama
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// AI servis fonksiyonlarını import et
// Not: TypeScript dosyası olduğu için transpile edilmeli
// Şimdilik basit JavaScript implementasyonu kullanıyoruz

let Product;
try {
  Product = mongoose.model('Product');
} catch {
  const ProductSchema = require('./schemas/product');
  Product = mongoose.model('Product', ProductSchema);
}

// ============================================
// AI ÜRÜN ÖNERİLERİ
// ============================================

/**
 * POST /api/ai/recommendations
 * Body: SearchCriteria
 * Kullanıcının tercihlerine göre AI önerileri
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { category, priceRange, specifications, purpose } = req.body;

    // Ürünleri al
    const filters = {};
    if (category) filters.category = category;
    if (priceRange) {
      filters['prices.price'] = {
        $gte: priceRange.min,
        $lte: priceRange.max
      };
    }

    const products = await Product.find(filters)
      .sort({ rating: -1 })
      .limit(50);

    // Basit öneri algoritması (gerçek AI yerine)
    // Fiyat-performans ve puan bazlı sıralama
    const recommendations = products
      .map(product => {
        const avgPrice = product.prices.reduce((sum, p) => sum + p.price, 0) / product.prices.length;
        const pricePerformance = (product.rating / avgPrice) * 10000;
        
        return {
          productId: product._id,
          product,
          reason: getRecommendationReason(product, purpose),
          score: Math.min(100, Math.round(product.rating * 20)),
          pricePerformance: Math.min(100, Math.round(pricePerformance))
        };
      })
      .sort((a, b) => b.pricePerformance - a.pricePerformance)
      .slice(0, 5);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('AI öneri hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Öneriler oluşturulamadı'
    });
  }
});

function getRecommendationReason(product, purpose) {
  const reasons = [
    'Yüksek kullanıcı puanı',
    'Mükemmel fiyat-performans oranı',
    'Popüler ve güvenilir marka',
    'Öne çıkan özellikleri'
  ];
  
  if (product.category === 'Gıda') {
    return 'Sağlıklı içerik ve kaliteli malzemeler';
  }
  
  if (purpose === 'oyun') {
    return 'Oyun performansı için optimize edilmiş';
  }
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// ============================================
// PC BUILDER AI
// ============================================

/**
 * POST /api/ai/pc-builder
 * Body: PCBuilderRequest
 * Bütçe ve amaca göre PC konfigürasyonu öner
 */
router.post('/pc-builder', async (req, res) => {
  try {
    const { budget, purpose, games, preferences } = req.body;

    if (!budget) {
      return res.status(400).json({
        success: false,
        error: 'Bütçe belirtilmeli'
      });
    }

    // Bilgisayar parçalarını al
    const components = await Product.find({
      category: 'Bilgisayar',
      'prices.price': { $lte: budget }
    });

    // Parça tiplerini ayır
    const cpus = components.filter(c => 
      c.name.toLowerCase().includes('işlemci') || 
      c.name.toLowerCase().includes('processor')
    );
    const gpus = components.filter(c => 
      c.name.toLowerCase().includes('ekran kartı') || 
      c.name.toLowerCase().includes('rtx') ||
      c.name.toLowerCase().includes('nvidia')
    );
    const rams = components.filter(c => 
      c.name.toLowerCase().includes('ram')
    );
    const storages = components.filter(c => 
      c.name.toLowerCase().includes('ssd') || 
      c.name.toLowerCase().includes('hdd')
    );

    // Basit bütçe dağılımı
    const distribution = purpose === 'oyun' 
      ? { cpu: 0.25, gpu: 0.45, ram: 0.15, storage: 0.15 }
      : { cpu: 0.35, gpu: 0.30, ram: 0.20, storage: 0.15 };

    // Her kategoriden en uygun ürünü seç
    const selectedComponents = [];
    let totalPrice = 0;

    // İşlemci seç
    if (cpus.length > 0) {
      const cpu = findBestComponent(cpus, budget * distribution.cpu, purpose);
      if (cpu) {
        selectedComponents.push({
          type: 'İşlemci',
          product: cpu,
          reason: `${purpose === 'oyun' ? 'Oyunlar' : 'İş yükü'} için optimize edilmiş`
        });
        totalPrice += cpu.prices[0].price;
      }
    }

    // Ekran kartı seç
    if (gpus.length > 0) {
      const gpu = findBestComponent(gpus, budget * distribution.gpu, purpose);
      if (gpu) {
        selectedComponents.push({
          type: 'Ekran Kartı',
          product: gpu,
          reason: purpose === 'oyun' 
            ? 'Yüksek FPS ve görsel kalite için' 
            : 'Grafik işleme gücü'
        });
        totalPrice += gpu.prices[0].price;
      }
    }

    // RAM seç
    if (rams.length > 0) {
      const ram = findBestComponent(rams, budget * distribution.ram, purpose);
      if (ram) {
        selectedComponents.push({
          type: 'RAM',
          product: ram,
          reason: 'Çoklu görev ve hızlı sistem performansı'
        });
        totalPrice += ram.prices[0].price;
      }
    }

    // Depolama seç
    if (storages.length > 0) {
      const storage = findBestComponent(storages, budget * distribution.storage, purpose);
      if (storage) {
        selectedComponents.push({
          type: 'Depolama',
          product: storage,
          reason: 'Hızlı yükleme süreleri ve geniş alan'
        });
        totalPrice += storage.prices[0].price;
      }
    }

    // Performans skoru hesapla
    const performanceScore = calculatePerformanceScore(selectedComponents, purpose);

    // Oyun performansı tahmini (varsa)
    let gamePerformance = undefined;
    if (purpose === 'oyun' && games && games.length > 0) {
      gamePerformance = games.map(game => ({
        game,
        expectedFPS: estimateFPS(selectedComponents, game),
        settings: totalPrice > budget * 0.7 ? 'Ultra' : totalPrice > budget * 0.5 ? 'Yüksek' : 'Orta'
      }));
    }

    res.json({
      success: true,
      data: {
        totalPrice: Math.round(totalPrice),
        components: selectedComponents,
        performanceScore,
        gamePerformance,
        message: totalPrice <= budget 
          ? 'Bütçenize uygun mükemmel bir konfigürasyon!' 
          : 'Bütçeyi biraz aşıyor, ancak en iyi performans için öneriyoruz'
      }
    });
  } catch (error) {
    console.error('PC builder hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PC konfigürasyonu oluşturulamadı'
    });
  }
});

function findBestComponent(components, targetBudget, purpose) {
  return components
    .filter(c => c.prices[0].price <= targetBudget * 1.2)
    .sort((a, b) => {
      const scoreA = (a.rating / a.prices[0].price) * 1000;
      const scoreB = (b.rating / b.prices[0].price) * 1000;
      return scoreB - scoreA;
    })[0];
}

function calculatePerformanceScore(components, purpose) {
  const avgRating = components.reduce((sum, c) => sum + c.product.rating, 0) / components.length;
  const baseScore = avgRating * 20;
  
  // Purpose'a göre bonus
  const bonus = purpose === 'oyun' && components.some(c => c.type === 'Ekran Kartı') ? 10 : 0;
  
  return Math.min(100, Math.round(baseScore + bonus));
}

function estimateFPS(components, game) {
  // Basit FPS tahmini
  const hasHighEndGPU = components.some(c => 
    c.type === 'Ekran Kartı' && c.product.name.toLowerCase().includes('rtx')
  );
  
  const baseFPS = hasHighEndGPU ? 120 : 60;
  return Math.round(baseFPS + Math.random() * 30);
}

// ============================================
// KAMERA İLE ÜRÜN TARAMA
// ============================================

/**
 * POST /api/ai/scan-product
 * Body: { imageBase64: string }
 * Mobil kamera ile ürün tara ve analiz et
 */
router.post('/scan-product', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Görsel gerekli'
      });
    }

    // Gerçek AI implementasyonu yerine basit simülasyon
    // Gerçek uygulamada OpenAI Vision API kullanılmalı
    
    // Örnek ürün tespiti
    const products = await Product.find().limit(10);
    const randomProduct = products[Math.floor(Math.random() * products.length)];

    const result = {
      productName: randomProduct.name,
      matchedProduct: randomProduct,
      confidence: 85,
      analysis: `${randomProduct.name} tespit edildi. Bu ürün ${randomProduct.category} kategorisinde.`,
      recommendation: randomProduct.rating >= 4 ? 'Alınabilir' : randomProduct.rating >= 3 ? 'Dikkatli' : 'Alınmamalı',
      reasons: [
        `Kullanıcı puanı: ${randomProduct.rating}/5`,
        `${randomProduct.prices.length} farklı satıcıda mevcut`,
        randomProduct.category === 'Gıda' ? 'İçindekiler incelendi' : 'Teknik özellikler değerlendirildi'
      ]
    };

    // Gıda ürünüyse içindekiler analizi ekle
    if (randomProduct.ingredients && randomProduct.ingredients.length > 0) {
      result.ingredientAnalysis = randomProduct.ingredients;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Kamera tarama hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Ürün taraması başarısız'
    });
  }
});

// ============================================
// İÇİNDEKİLER ANALİZİ
// ============================================

/**
 * POST /api/ai/ingredients
 * Body: { productName: string, ingredients: string[] }
 * Gıda içindekilerini analiz et
 */
router.post('/ingredients', async (req, res) => {
  try {
    const { productName, ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'İçindekiler listesi gerekli'
      });
    }

    // Basit içindekiler analizi
    // Gerçek uygulamada AI kullanılmalı
    const analysis = ingredients.map(ingredient => {
      const lower = ingredient.toLowerCase();
      
      let status = 'şüpheli';
      let description = 'Daha fazla araştırma gerekli';
      let healthScore = 5;

      // Yararlı maddeler
      if (lower.includes('vitamin') || lower.includes('protein') || 
          lower.includes('kalsiyum') || lower.includes('demir') ||
          lower.includes('omega')) {
        status = 'yararlı';
        description = 'Sağlık için faydalı bir bileşen';
        healthScore = 8;
      }
      // Zararlı maddeler
      else if (lower.includes('aspartam') || lower.includes('msg') || 
               lower.includes('trans yağ') || lower.includes('nitrit')) {
        status = 'zararlı';
        description = 'Sağlık açısından dikkatli tüketilmeli';
        healthScore = 2;
      }
      // Doğal maddeler
      else if (lower.includes('su') || lower.includes('tuz') || 
               lower.includes('şeker') || lower.includes('un')) {
        status = 'yararlı';
        description = 'Doğal ve yaygın kullanılan bileşen';
        healthScore = 6;
      }

      return {
        name: ingredient,
        status,
        description,
        healthScore
      };
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('İçindekiler analiz hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Analiz başarısız'
    });
  }
});

// ============================================
// AKILLI ARAMA
// ============================================

/**
 * POST /api/ai/smart-search
 * Body: { query: string }
 * Doğal dil ile arama yap
 */
router.post('/smart-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Arama sorgusu gerekli'
      });
    }

    // Basit NLP - anahtar kelimeleri çıkar
    const lowerQuery = query.toLowerCase();
    
    const criteria = {
      query: query
    };

    // Kategori tespiti
    if (lowerQuery.includes('bilgisayar') || lowerQuery.includes('pc') || lowerQuery.includes('laptop')) {
      criteria.category = 'Bilgisayar';
    } else if (lowerQuery.includes('yiyecek') || lowerQuery.includes('gıda')) {
      criteria.category = 'Gıda';
    } else if (lowerQuery.includes('elektronik')) {
      criteria.category = 'Elektronik';
    }

    // Bütçe tespiti
    const budgetMatch = lowerQuery.match(/(\d+)\s*(bin|lira|tl|₺)/);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]);
      const unit = budgetMatch[2];
      const budget = unit === 'bin' ? amount * 1000 : amount;
      
      criteria.priceRange = {
        min: budget * 0.8,
        max: budget * 1.2
      };
    }

    // Purpose tespiti
    if (lowerQuery.includes('oyun')) {
      criteria.purpose = 'oyun';
    } else if (lowerQuery.includes('iş') || lowerQuery.includes('ofis')) {
      criteria.purpose = 'iş';
    }

    res.json({
      success: true,
      data: criteria,
      message: 'Arama kriterleri başarıyla çıkarıldı'
    });
  } catch (error) {
    console.error('Akıllı arama hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Arama işlenemedi'
    });
  }
});

module.exports = router;
