'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import ProductCard from '@/components/ProductCard'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { RootState, AppDispatch } from '@/store'
import { fetchCards, setFilters, setPage } from '@/store/productsSlice'
import { fetchExchangeRate } from '@/store/currencySlice'


function CardsPageContent() {
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const [clientSideFilter, setClientSideFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('Precio: Menor a mayor')
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  
  // In-stock pagination state
  const [allInStockIds, setAllInStockIds] = useState<string[]>([])
  const [displayedCards, setDisplayedCards] = useState<any[]>([])
  const [inStockPage, setInStockPage] = useState(1)
  const [isLoadingInStock, setIsLoadingInStock] = useState(false)
  
  const CARDS_PER_PAGE = 300
  
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
            setInStockPage(1)
            setDisplayedCards([])
            
            // Load first page
            if (inStockIds.length > 0) {
              loadInStockPage(inStockIds, 1)
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

  const smoothScrollToTop = useCallback(() => {
    const scrollDuration = 600 // Duration in milliseconds
    const scrollStep = -window.scrollY / (scrollDuration / 15)
    
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep)
      } else {
        clearInterval(scrollInterval)
      }
    }, 15)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    // Scroll to top smoothly when changing pages
    smoothScrollToTop()
    dispatch(setPage(page))
  }, [dispatch, smoothScrollToTop])

  const handleClearSearch = () => {
    dispatch(setFilters({ name: '' }))
  }

  // Load a specific page of in-stock cards
  const loadInStockPage = useCallback(async (allIds: string[], pageNum: number) => {
    const startIdx = (pageNum - 1) * CARDS_PER_PAGE
    const endIdx = startIdx + CARDS_PER_PAGE
    const pageIds = allIds.slice(startIdx, endIdx)
    
    if (pageIds.length === 0) {
      setIsLoadingInStock(false)
      return
    }
    
    setIsLoadingInStock(true)
    
    try {
      const response = await fetch('/api/search-with-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productIds: pageIds,
          pageSize: CARDS_PER_PAGE 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newCards = data.results || []
        
        setDisplayedCards(newCards) // Replace cards, not append
        setIsLoadingInStock(false)
        
        console.log(`[CardsPage] Loaded page ${pageNum}, cards: ${newCards.length}`)
      }
    } catch (error) {
      console.error('[CardsPage] Error loading card page:', error)
      setIsLoadingInStock(false)
    }
  }, [CARDS_PER_PAGE])

  // Handle in-stock page change
  const handleInStockPageChange = useCallback((pageNum: number) => {
    // Scroll to top smoothly when changing pages
    smoothScrollToTop()
    setInStockPage(pageNum)
    loadInStockPage(allInStockIds, pageNum)
  }, [allInStockIds, loadInStockPage, smoothScrollToTop])

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
      // First priority: in-stock cards ALWAYS at top
      const aInStock = 'inStock' in a ? a.inStock : false
      const bInStock = 'inStock' in b ? b.inStock : false
      
      if (aInStock && !bInStock) return -1
      if (!aInStock && bInStock) return 1
      
      // Second priority: apply price sort order (use retailPrice which is what we display)
      const aPrice = a.pricing?.retailPrice || a.pricing?.marketPrice || 0
      const bPrice = b.pricing?.retailPrice || b.pricing?.marketPrice || 0
      
      if (sortOrder === 'Precio: Menor a mayor') {
        return aPrice - bPrice
      } else if (sortOrder === 'Precio: Mayor a menor') {
        return bPrice - aPrice
      }
      
      return 0
    })
    
    return filtered
  }, [sourceCards, clientSideFilter, sortOrder, showOnlyInStock])

  // Calculate in-stock count from filtered cards (TEMPORARILY showing only in-stock count)
  const inStockCount = useMemo(() => {
    if (!filteredAndSortedCards || filteredAndSortedCards.length === 0) return 0
    return filteredAndSortedCards.filter(card => 
      'inStock' in card ? card.inStock : false
    ).length
  }, [filteredAndSortedCards])

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="container-custom py-8 flex flex-col gap-4">
        {/* Page header with search query display */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2 font-thunder">
            {showingInStock
              ? `Cartas en Stock (${allInStockIds.length})`
              : filters.name && filters.name.trim() !== ''
              ? `Resultados para ${filters.name} (${inStockCount})`
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

            {/* Right side: Filter input and Sort dropdown */}
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
                <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                    {(() => {
                      // Separate cards into in-stock and out-of-stock
                      const inStockCards = filteredAndSortedCards.filter(card => 
                        'inStock' in card ? card.inStock : false
                      )
                      const outOfStockCards = filteredAndSortedCards.filter(card => 
                        !('inStock' in card ? card.inStock : false)
                      )

                      return (
                        <>
                          {/* In Stock Section */}
                          {inStockCards.length > 0 && (
                            <div className="space-y-6">
                              {/* Only show section header when NOT in the inStock-only view */}
                              {!showingInStock && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                                  <h2 className="text-2xl font-bold text-green-800 font-thunder">
                                    En Stock ({inStockCards.length})
                                  </h2>
                                  <p className="text-green-700 text-sm font-interphases mt-1">
                                    Disponibles para entrega inmediata
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {inStockCards.map((card) => (
                                  <ProductCard 
                                    key={card.id} 
                                    card={card}
                                    showAddToCart={true}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Banner in the middle (only show if both sections exist) */}
                          {inStockCards.length > 0 && outOfStockCards.length > 0 && (
                            <div className="relative overflow-hidden hero-bg rounded-lg my-12">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90"></div>
                              <div className="relative z-10 py-12 px-6 text-center">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-thunder">
                                  ¡Compramos tus cartas!
                                </h2>
                                <p className="text-white/90 text-lg mb-6 font-interphases">
                                  ¿Tenés cartas que querés vender? Consultanos por WhatsApp
                                </p>
                                <a
                                  href="https://wa.me/5491158204843"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                  </svg>
                                  Contactar por WhatsApp
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Out of Stock Section - TEMPORARILY REMOVED */}
                          {/* {outOfStockCards.length > 0 && (
                            <div className="space-y-6">
                              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                <h2 className="text-2xl font-bold text-orange-800 font-thunder">
                                  Por Encargo ({outOfStockCards.length})
                                </h2>
                                <p className="text-orange-700 text-sm font-interphases mt-1">
                                  Disponibles bajo pedido
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {outOfStockCards.map((card) => (
                                  <ProductCard 
                                    key={card.id} 
                                    card={card}
                                    showAddToCart={true}
                                  />
                                ))}
                              </div>
                            </div>
                          )} */}
                        </>
                      )
                    })()}

                    {/* Pagination for in-stock view */}
                {showingInStock && allInStockIds.length > CARDS_PER_PAGE && (
                  <div className="space-y-4 mt-8">
                    {/* Pagination Info */}
                    <div className="text-center text-sm text-gray-600">
                      Mostrando {((inStockPage - 1) * CARDS_PER_PAGE) + 1} - {Math.min(inStockPage * CARDS_PER_PAGE, allInStockIds.length)} de {allInStockIds.length} cartas en stock
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => handleInStockPageChange(1)}
                        disabled={inStockPage === 1 || isLoadingInStock}
                        className="px-3 py-1 rounded-button text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ««
                      </button>
                      <button
                        onClick={() => handleInStockPageChange(inStockPage - 1)}
                        disabled={inStockPage === 1 || isLoadingInStock}
                        className="px-3 py-1 rounded-button text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        « Anterior
                      </button>
                      
                      <div className="flex gap-2">
                        {(() => {
                          const totalPages = Math.ceil(allInStockIds.length / CARDS_PER_PAGE);
                          const pages: (number | string)[] = [];
                          
                          if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            if (inStockPage <= 3) {
                              pages.push(1, 2, 3, 4, '...', totalPages);
                            } else if (inStockPage >= totalPages - 2) {
                              pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                            } else {
                              pages.push(1, '...', inStockPage - 1, inStockPage, inStockPage + 1, '...', totalPages);
                            }
                          }
                          
                          return pages.map((pageNum, idx) => {
                            if (pageNum === '...') {
                              return <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleInStockPageChange(pageNum as number)}
                                disabled={isLoadingInStock}
                                className={`px-3 py-1 rounded-button text-sm font-medium transition-colors ${
                                  pageNum === inStockPage
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
                        onClick={() => handleInStockPageChange(inStockPage + 1)}
                        disabled={inStockPage >= Math.ceil(allInStockIds.length / CARDS_PER_PAGE) || isLoadingInStock}
                        className="px-3 py-1 rounded-button text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente »
                      </button>
                      <button
                        onClick={() => handleInStockPageChange(Math.ceil(allInStockIds.length / CARDS_PER_PAGE))}
                        disabled={inStockPage >= Math.ceil(allInStockIds.length / CARDS_PER_PAGE) || isLoadingInStock}
                        className="px-3 py-1 rounded-button text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagination (for search view) */}
                {!showingInStock && pagination.totalCount > pagination.pageSize && (
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

      {/* Floating WhatsApp Button with Arrow */}
      <FloatingWhatsApp showArrow={true} />
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
