'use client'

import { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useRouter } from 'next/navigation'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import ProductCard from '@/components/ProductCard'
import { RootState, AppDispatch } from '@/store'
import { fetchCards, setFilters, setPage, setInStockCards } from '@/store/productsSlice'
import { fetchExchangeRate } from '@/store/currencySlice'


function CardsPageContent() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clientSideFilter, setClientSideFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('Precio: Menor a mayor')
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  
  // Infinite scroll state for in-stock cards
  const [allInStockIds, setAllInStockIds] = useState<string[]>([])
  const [displayedCards, setDisplayedCards] = useState<any[]>([])
  const [currentBatch, setCurrentBatch] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreCards, setHasMoreCards] = useState(true)
  const [isLoadingInStock, setIsLoadingInStock] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const CARDS_PER_BATCH = 20
  
  const { 
    cards, 
    loading, 
    error, 
    filters, 
    pagination
  } = useSelector((state: RootState) => state.products)
  
  // Get current dollar rate from currency state
  const { dolarBlueRate } = useSelector((state: RootState) => state.currency)
  
  // Fetch exchange rate on mount
  useEffect(() => {
    console.log('[CardsPage] Fetching exchange rate on mount...')
    dispatch(fetchExchangeRate())
  }, [dispatch])
  
  // Log the dollar rate whenever it changes
  useEffect(() => {
    console.log('[CardsPage] Current Dollar Rate:', dolarBlueRate)
  }, [dolarBlueRate])

  // Initialize: Fetch inventory IDs and load first batch
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    const rarityFilter = searchParams.get('rarity')
    const inStockParam = searchParams.get('inStock')

    const fetchInStockInventory = async () => {
      // Only show ONLY in-stock cards if inStock=true is explicitly set
      const shouldShowOnlyInStock = inStockParam === 'true'
      
      // Sync state with URL parameter
      setShowOnlyInStock(shouldShowOnlyInStock)
      
      if (shouldShowOnlyInStock) {
        console.log('[CardsPage] Fetching in-stock inventory...')
        setIsLoadingInStock(true)
        
        try {
          const inventoryResponse = await fetch('/api/inventory')
          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json()
            const inventory = inventoryData.inventory || {}
            
            // Get all productIds with ANY variant in stock
            const inStockIds = Object.keys(inventory)
              .filter(productId => {
                const variants = inventory[productId]
                return Object.values(variants).some((qty: any) => qty > 0)
              })
            
            console.log(`[CardsPage] Found ${inStockIds.length} products in stock`)
            
            // Store all IDs for pagination
            setAllInStockIds(inStockIds)
            setCurrentBatch(0)
            setDisplayedCards([])
            setHasMoreCards(inStockIds.length > 0)
            
            // Load first batch
            if (inStockIds.length > 0) {
              loadCardBatch(inStockIds, 0)
            } else {
              setIsLoadingInStock(false)
            }
            
            return
          }
        } catch (error) {
          console.error('[CardsPage] Error fetching in-stock cards:', error)
          setIsLoadingInStock(false)
        }
        
        // Fallback: no inventory or error
        setAllInStockIds([])
        setDisplayedCards([])
        setIsLoadingInStock(false)
        dispatch(setFilters({ name: '' }))
        return
      }
      
      // Normal search flow (default: show all cards from search, with in-stock first)
      setAllInStockIds([]) // Clear infinite scroll state
      setDisplayedCards([])
      setIsLoadingInStock(false)
      const newFilters: Record<string, string> = {}
      newFilters.name = searchQuery || 'pokemon'
      if (rarityFilter) newFilters.rarity = rarityFilter
      
      dispatch(setFilters(newFilters))
    }
    
    fetchInStockInventory()
  }, [searchParams, dispatch])

  // Fetch data when filters change (prevents double call)
  useEffect(() => {
    const inStockParam = searchParams.get('inStock')
    const shouldShowOnlyInStock = inStockParam === 'true'
    
    // Only fetch if NOT showing the in-stock-only view
    if (filters.name && !shouldShowOnlyInStock) {
      dispatch(fetchCards({ filters }))
    }
  }, [dispatch, filters, searchParams])

  const handlePageChange = useCallback((page: number) => {
    // Scroll to top smoothly when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
    dispatch(setPage(page))
  }, [dispatch])

  const handleClearSearch = () => {
    dispatch(setFilters({ name: '' }))
  }

  // Load a batch of cards by IDs
  const loadCardBatch = async (allIds: string[], batchIndex: number) => {
    const startIdx = batchIndex * CARDS_PER_BATCH
    const endIdx = startIdx + CARDS_PER_BATCH
    const batchIds = allIds.slice(startIdx, endIdx)
    
    if (batchIds.length === 0) {
      setHasMoreCards(false)
      setIsLoadingInStock(false)
      return
    }
    
    try {
      const response = await fetch('/api/search-with-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productIds: batchIds,
          pageSize: CARDS_PER_BATCH 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newCards = data.results || []
        
        setDisplayedCards(prev => [...prev, ...newCards])
        setCurrentBatch(batchIndex)
        setHasMoreCards(endIdx < allIds.length)
        setIsLoadingInStock(false)
        setIsLoadingMore(false)
        
        console.log(`[CardsPage] Loaded batch ${batchIndex + 1}, cards: ${newCards.length}`)
      }
    } catch (error) {
      console.error('[CardsPage] Error loading card batch:', error)
      setIsLoadingInStock(false)
      setIsLoadingMore(false)
    }
  }

  // Check if we're showing in-stock view
  const inStockParam = searchParams.get('inStock')
  const showingInStock = inStockParam === 'true'
  
  // Determine which cards to use (in-stock batch loaded or search results)
  const sourceCards = (showingInStock && displayedCards.length > 0) ? displayedCards : cards

  // Client-side filtering and sorting
  const filteredAndSortedCards = useMemo(() => {
    if (!sourceCards || sourceCards.length === 0) return sourceCards
    
    let filtered = [...sourceCards]
    
    // Apply client-side text filter
    if (clientSideFilter.trim()) {
      const searchTerm = clientSideFilter.toLowerCase()
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(searchTerm) ||
        (card.categoryName && card.categoryName.toLowerCase().includes(searchTerm)) ||
        (card.rarity && card.rarity.toLowerCase().includes(searchTerm))
      )
    }
    
    // Apply "En Stock" filter
    if (showOnlyInStock) {
      filtered = filtered.filter(card => {
        const isInStock = 'inStock' in card ? card.inStock : false
        return isInStock
      })
    }
    
    // Sort cards
    filtered.sort((a, b) => {
      // First priority: in-stock cards always at top
      const aInStock = 'inStock' in a ? a.inStock : false
      const bInStock = 'inStock' in b ? b.inStock : false
      
      if (aInStock && !bInStock) return -1
      if (!aInStock && bInStock) return 1
      
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
  }, [sourceCards, clientSideFilter, sortOrder, showOnlyInStock])

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="container-custom py-8 flex flex-col gap-4">
        {/* Page header with search query display */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2 font-thunder">
            {showingInStock
              ? `Cartas en Stock (${allInStockIds.length})`
              : filters.name && filters.name.trim() !== ''
              ? `Resultados para ${filters.name} (${pagination.totalCount})`
              : 'Catálogo de Cartas Pokemon'}
          </h1>
          {showingInStock && (
            <p className="text-gray-600 font-interphases">
              Disponibles para entrega inmediata
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Mobile Search Box (only when no active query) */}
          {(!filters.name || filters.name.trim() === '') && (
            <div className="block sm:hidden">
              <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-300">
                <div className="pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar cartas..."
                  className="flex-1 px-3 py-3 text-base border-0 focus:ring-0 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const query = e.currentTarget.value.trim();
                      if (query) {
                        dispatch(setFilters({ name: query }));
                      }
                    }
                  }}
                />
                <button
                  className="px-4 py-3 bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors duration-200"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const query = input.value.trim();
                    if (query) {
                      dispatch(setFilters({ name: query }));
                    }
                  }}
                >
                  Buscar
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            {/* Left side: Search query chip (hide when showing in-stock) */}
            {filters.name && filters.name.trim() !== '' && !showingInStock && (
              <div className="flex items-center gap-3 border-2 border-blue-500 px-6 py-3 rounded-full font-interphases w-max">
                <span className="text-base text-gray-700 font-interphases">
                  <span className="font-medium font-interphases">{filters.name}</span>
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

            {/* Right side: Filter input, Stock toggle, and Sort dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-end">
              {/* Client-side filter input */}
              <input
                type="text"
                value={clientSideFilter}
                onChange={(e) => setClientSideFilter(e.target.value)}
                placeholder="Filtrar resultados..."
                className="w-full sm:w-64 bg-gray-200 border-0 py-3 px-4 rounded-md font-interphases text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#F0F0F0' }}
              />

              {/* "En Stock" Toggle */}
              <button
                onClick={() => {
                  const inStockParam = searchParams.get('inStock')
                  if (inStockParam === 'true') {
                    // If already showing in-stock, go back to all cards
                    router.push('/cards')
                  } else {
                    // Navigate to in-stock view
                    router.push('/cards?inStock=true')
                  }
                }}
                className={`flex items-center gap-2 py-3 px-4 rounded-md font-interphases text-base font-medium transition-all ${
                  showOnlyInStock
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showOnlyInStock ? 'bg-white' : 'bg-green-500'}`}></div>
                <span>En Stock</span>
              </button>

              {/* Sort dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-gray-300 py-3 px-4 pr-10 rounded-md appearance-none cursor-pointer font-interphases text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {/* Loading Overlay - Search */}
            {loading && filters.name && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      🔍 Buscando cartas...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Overlay - In Stock */}
            {isLoadingInStock && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      📦 Buscando cartas...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cards grid */}
            {(loading || isLoadingInStock) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
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
                        <div className="flex gap-3">
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-18 animate-pulse"></div>
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
                <p className="text-red-600 mb-4 font-medium">Error al cargar las cartas</p>
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => dispatch(fetchCards({ filters }))}
                  className="btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredAndSortedCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {clientSideFilter 
                    ? `No se encontraron cartas que coincidan con "${clientSideFilter}"`
                    : 'No se encontraron cartas con estos filtros'}
                </p>
                <button 
                  onClick={() => {
                    setClientSideFilter('')
                  }} 
                  className="btn btn-primary"
                >
                  Limpiar filtros
                </button>
              </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAndSortedCards.map((card) => (
                        <ProductCard 
                          key={card.id} 
                          card={card}
                          showAddToCart={true}
                        />
                      ))}
                    </div>

                {/* Pagination */}
                {pagination.totalCount > pagination.pageSize && (
                  <div className="space-y-4 mt-8">
                    {/* Pagination Info */}
                    <div className="text-center text-sm text-gray-600">
                      Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} de {pagination.totalCount} cartas
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.page <= 1 || loading}
                        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Primera página"
                      >
                        ««
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1 || loading}
                        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        « Anterior
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-2">
                        {(() => {
                          const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
                          const currentPage = pagination.page;
                          const pages: (number | string)[] = [];
                          
                          // Always show first page
                          pages.push(1);
                          
                          // Show pages around current page
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          
                          // Add ellipsis if needed
                          if (start > 2) pages.push('...');
                          
                          // Add middle pages
                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }
                          
                          // Add ellipsis if needed
                          if (end < totalPages - 1) pages.push('...');
                          
                          // Always show last page (if more than 1 page)
                          if (totalPages > 1) pages.push(totalPages);
                          
                          return pages.map((pageNum, idx) => {
                            if (pageNum === '...') {
                              return <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum as number)}
                                disabled={loading}
                                className={`px-3 py-1 rounded-button text-sm font-medium transition-colors ${
                                  pageNum === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                } disabled:opacity-50`}
                              >
                                {pageNum}
                              </button>
                            );
                          });
                        })()}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize) || loading}
                        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente »
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(Math.ceil(pagination.totalCount / pagination.pageSize))}
                        disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize) || loading}
                        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Última página"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando cartas...</p>
        </div>
      </div>
    }>
      <CardsPageContent />
    </Suspense>
  )
}
