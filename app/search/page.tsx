/**
 * ARAMA SONUÇLARI SAYFASI
 * 
 * Kullanıcının arama yaptığı sonuçları gösterir
 * - Filtreleme
 * - Sıralama
 * - AI önerileri
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { searchProducts, smartSearch } from '@/lib/api'
import type { Product, SearchResults as SearchResultsType } from '@/types'
import { Filter, Sparkles, ChevronDown, Grid, List } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const isAI = searchParams.get('ai') === 'true'

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<SearchResultsType | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadResults()
  }, [query, isAI])

  async function loadResults() {
    setLoading(true)
    try {
      let criteria: any = { query }

      // AI arama ise önce query'yi parse et
      if (isAI) {
        const aiResult = await smartSearch(query)
        if (aiResult.success && aiResult.data) {
          criteria = { ...criteria, ...aiResult.data }
        }
      }

      const response = await searchProducts(criteria)
      if (response.success && response.data) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Arama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="container-padding mx-auto py-8">
          {/* Başlık */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">
                {isAI && <Sparkles className="inline w-8 h-8 text-primary-500 mr-2" />}
                Arama Sonuçları
              </h1>
              
              {/* Görünüm seçici */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-gray-600">
              &quot;{query}&quot; için {results?.total || 0} sonuç bulundu
              {isAI && <span className="ml-2 text-primary-600 font-medium">(AI Analizi Aktif)</span>}
            </p>
          </div>

          {/* Filtreler ve Sonuçlar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filtreler (Sol) */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-md sticky top-24">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-between w-full lg:hidden mb-4"
                >
                  <span className="font-semibold">Filtreler</span>
                  <ChevronDown className="w-5 h-5" />
                </button>

                <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <h3 className="font-semibold text-lg mb-4">Filtrele</h3>
                  
                  {/* Kategoriler */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Kategori</h4>
                    <div className="space-y-2">
                      {['Elektronik', 'Bilgisayar', 'Gıda', 'İçecek', 'Hobi'].map(cat => (
                        <label key={cat} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fiyat Aralığı */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Fiyat</h4>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Puan */}
                  <div>
                    <h4 className="font-medium mb-2">Minimum Puan</h4>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Tümü</option>
                      <option value="4">4+ Yıldız</option>
                      <option value="3">3+ Yıldız</option>
                    </select>
                  </div>
                </div>
              </div>
            </aside>

            {/* Sonuçlar (Sağ) */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="spinner" />
                </div>
              ) : results && results.products.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }>
                  {results.products.map((product) => (
                    <ProductCard key={product._id} product={product} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Sonuç bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

function ProductCard({ product, viewMode }: { product: Product, viewMode: 'grid' | 'list' }) {
  const minPrice = Math.min(...product.prices.map(p => p.price))

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all flex gap-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-32 h-32 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-600">{minPrice.toFixed(2)} ₺</p>
              <p className="text-sm text-gray-500">{product.prices.length} satıcı</p>
            </div>
            <button className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              İncele
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
      <img
        src={product.images[0]}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-center mb-2">
          <span className="text-yellow-400">★</span>
          <span className="ml-1 text-sm">{product.rating}</span>
          <span className="ml-1 text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <p className="text-2xl font-bold text-primary-600 mb-3">{minPrice.toFixed(2)} ₺</p>
        <button className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Detayları Gör
        </button>
      </div>
    </div>
  )
}
