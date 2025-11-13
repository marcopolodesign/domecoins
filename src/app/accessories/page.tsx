'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import ProductCard from '@/components/ProductCard'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { RootState } from '@/store'
import type { Accessory } from '@/lib/kv'

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('Precio: Menor a mayor')
  
  // Get current dollar rate from currency state
  const { dolarBlueRate } = useSelector((state: RootState) => state.currency)

  // Fetch accessories on mount
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/accessories')
        
        if (response.ok) {
          const data = await response.json()
          setAccessories(data.accessories || [])
        } else {
          setError('Error al cargar los accesorios')
        }
      } catch (err) {
        console.error('[AccessoriesPage] Error fetching accessories:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchAccessories()
  }, [])

  // Helper function to transform Cloudinary URLs for browser compatibility
  const transformCloudinaryUrl = (url: string): string => {
    if (!url) return url;
    
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com/') && url.includes('/upload/')) {
      // Add f_auto (automatic format) and q_auto (automatic quality) transformations
      // This converts HEIC to WebP/JPG automatically based on browser support
      return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    
    return url;
  };

  // Transform accessories to card format for ProductCard component
  const transformedAccessories = useMemo(() => {
    return accessories.map(accessory => ({
      id: accessory.id,
      productId: accessory.id,
      name: accessory.productName,
      categoryName: accessory.setName,
      rarity: accessory.productLine,
      setId: accessory.number,
      imageUrl: transformCloudinaryUrl(accessory.imageUrl),
      inStock: accessory.addToQuantity > 0,
      stock: accessory.addToQuantity,
      printing: 'Normal',
      pricing: {
        marketPrice: accessory.price || 0,
        retailPrice: accessory.price || 0,
      },
      // Additional fields for filtering
      title: accessory.title,
      totalQuantity: accessory.totalQuantity,
    }))
  }, [accessories])

  // Filter and sort accessories
  const filteredAndSortedAccessories = useMemo(() => {
    let filtered = [...transformedAccessories]
    
    // Apply search filter
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(searchTerm)) ||
        (item.rarity && item.rarity.toLowerCase().includes(searchTerm)) ||
        (item.title && item.title.toLowerCase().includes(searchTerm))
      )
    }
    
    // Sort by price
    filtered.sort((a, b) => {
      // First priority: in-stock items at top
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      
      // Second priority: apply price sort order
      const aPrice = a.pricing?.marketPrice || 0
      const bPrice = b.pricing?.marketPrice || 0
      
      if (sortOrder === 'Precio: Menor a mayor') {
        return aPrice - bPrice
      } else if (sortOrder === 'Precio: Mayor a menor') {
        return bPrice - aPrice
      }
      
      return 0
    })
    
    return filtered
  }, [transformedAccessories, searchFilter, sortOrder])

  const handleClearSearch = () => {
    setSearchFilter('')
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="container-custom py-8 flex flex-col gap-4">
        {/* Page header */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2 font-thunder">
            Accesorios ({accessories.length})
          </h1>
          <p className="text-gray-600 font-interphases">
            Sleeves, binders, ETBs y más accesorios para tu colección
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Mobile Search Box */}
          <div className="block sm:hidden">
            <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-300">
              <div className="pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar accesorios..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1 px-3 py-3 text-base border-0 focus:ring-0 focus:outline-none"
              />
              {searchFilter && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            {/* Left side: Search query chip */}
            {searchFilter && (
              <div className="flex items-center gap-3 border-2 border-orange-500 px-6 py-3 rounded-full font-interphases w-max">
                <span className="text-base text-gray-700 font-interphases">
                  <span className="font-medium font-interphases">{searchFilter}</span>
                </span>
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Right side: Filter input and Sort dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-end">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar accesorios..."
                  className="w-full bg-gray-200 border-0 py-3 px-4 pr-10 rounded-md font-interphases text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ backgroundColor: '#F0F0F0' }}
                />
                {searchFilter && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-gray-300 py-3 px-4 pr-10 rounded-md appearance-none cursor-pointer font-interphases text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Precio: Menor a mayor">Precio: Menor a mayor</option>
                  <option value="Precio: Mayor a menor">Precio: Mayor a menor</option>
                </select>
                <ChevronDownIcon className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div>
            {/* Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                    <div className="flex flex-row flex-1">
                      <div className="w-36 h-50 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" style={{ width: '144px', height: '201px' }}></div>
                      <div className="flex-1 p-4 space-y-3" style={{ minHeight: '201px' }}>
                        <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="flex gap-3">
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 mb-4 font-medium">Error al cargar los accesorios</p>
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredAndSortedAccessories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchFilter 
                    ? `No se encontraron accesorios que coincidan con "${searchFilter}"`
                    : 'No hay accesorios disponibles'}
                </p>
                {searchFilter && (
                  <button 
                    onClick={handleClearSearch} 
                    className="btn btn-primary"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedAccessories.map((accessory) => (
                    <ProductCard 
                      key={accessory.id} 
                      card={accessory}
                      showAddToCart={true}
                    />
                  ))}
                </div>

                {/* Results info */}
                {searchFilter && (
                  <div className="text-center text-sm text-gray-600 mt-6">
                    Mostrando {filteredAndSortedAccessories.length} de {accessories.length} accesorios
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button with Arrow */}
      <FloatingWhatsApp showArrow={true} />
    </div>
  )
}

