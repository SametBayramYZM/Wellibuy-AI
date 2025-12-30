/**
 * HEADER BİLEŞENİ
 * 
 * Üst menü çubuğu:
 * - Logo
 * - Arama çubuğu
 * - Kategori menüsü
 * - AI asistan butonu
 * - Mobil uyumlu hamburger menü
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, Sparkles, ShoppingCart, User } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Ana kategoriler
  const categories = [
    { name: 'Elektronik', href: '/categories/elektronik' },
    { name: 'Bilgisayar', href: '/categories/bilgisayar' },
    { name: 'Gıda', href: '/categories/gida' },
    { name: 'İçecek', href: '/categories/icecek' },
    { name: 'Hobi', href: '/categories/hobi' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Üst bar - Logo ve arama */}
      <div className="border-b border-gray-200">
        <div className="container-padding mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-2xl font-bold text-gradient hidden sm:block">
                Wellibuy
              </span>
            </Link>

            {/* Desktop arama çubuğu */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            {/* Sağ menü */}
            <div className="flex items-center space-x-4">
              {/* Mobil arama butonu */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Ara"
              >
                <Search className="w-6 h-6 text-gray-600" />
              </button>

              {/* AI Asistan butonu */}
              <Link
                href="/ai-assistant"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">AI Asistan</span>
              </Link>

              {/* Sepet */}
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Sepet"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Kullanıcı */}
              <button
                className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Hesabım"
              >
                <User className="w-6 h-6 text-gray-600" />
              </button>

              {/* Mobil menü butonu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menü"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobil arama çubuğu */}
          {searchOpen && (
            <div className="md:hidden pb-4 animate-fade-in">
              <SearchBar onSearch={() => setSearchOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Alt bar - Kategoriler (Desktop) */}
      <div className="hidden md:block border-b border-gray-100">
        <div className="container-padding mx-auto">
          <nav className="flex items-center space-x-8 h-12">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/pc-builder"
              className="text-primary-600 font-medium flex items-center space-x-1 hover:text-primary-700"
            >
              <Sparkles className="w-4 h-4" />
              <span>PC Kur</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobil menü */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-fade-in">
          <nav className="container-padding py-4 space-y-2">
            {/* Kategoriler */}
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            
            {/* AI özel menüler */}
            <Link
              href="/pc-builder"
              className="block py-3 px-4 text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors flex items-center space-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-5 h-5" />
              <span>PC Kur</span>
            </Link>

            <Link
              href="/ai-assistant"
              className="block py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium transition-all flex items-center space-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Asistan</span>
            </Link>

            {/* Kullanıcı menüsü (mobil) */}
            <Link
              href="/profile"
              className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center space-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-5 h-5" />
              <span>Hesabım</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
