/**
 * ÜRÜN VERİTABANI MODELİ
 * 
 * MongoDB'de ürünlerin nasıl saklanacağını tanımlar.
 * Mongoose ORM kullanarak tip güvenliği sağlar.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { Product, ProductSpecification, PriceInfo, IngredientAnalysis } from '@/types';

// Fiyat Bilgisi Şeması
const PriceInfoSchema = new Schema<PriceInfo>({
  siteName: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  url: { 
    type: String, 
    required: true 
  },
  inStock: { 
    type: Boolean, 
    default: true 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Ürün Özellikleri Şeması
const ProductSpecificationSchema = new Schema<ProductSpecification>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  value: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    trim: true 
  },
  unit: { 
    type: String,
    trim: true 
  }
});

// Gıda İçindekiler Analizi Şeması
const IngredientAnalysisSchema = new Schema<IngredientAnalysis>({
  name: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['yararlı', 'zararlı', 'şüpheli'],
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  healthScore: { 
    type: Number, 
    min: 1, 
    max: 10,
    required: true 
  }
});

// Ana Ürün Şeması
const ProductSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: [true, 'Ürün adı zorunludur'],
      trim: true,
      index: true  // Arama performansı için indeks
    },
    description: {
      type: String,
      required: [true, 'Ürün açıklaması zorunludur']
    },
    category: {
      type: String,
      enum: ['Elektronik', 'Bilgisayar', 'Gıda', 'İçecek', 'Hobi', 'Diğer'],
      required: true,
      index: true
    },
    subcategory: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    model: {
      type: String,
      trim: true
    },
    images: [{
      type: String,
      required: true
    }],
    specifications: [ProductSpecificationSchema],
    prices: [PriceInfoSchema],
    ingredients: [IngredientAnalysisSchema],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true,  // createdAt ve updatedAt otomatik eklenir
    collection: 'products'
  }
);

// Arama için text indeksi
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text' 
});

// Model oluştur (eğer yoksa)
const ProductModel: Model<Product> = 
  mongoose.models.Product || mongoose.model<Product>('Product', ProductSchema);

export default ProductModel;
