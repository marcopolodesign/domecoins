'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { FunnelIcon, Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/outline'
import ProductCard from '@/components/ProductCard'
import { RootState, AppDispatch } from '@/store'
import { fetchCards, setFilters, setPage, setPageSize } from '@/store/productsSlice'
import { fetchExchangeRate } from '@/store/currencySlice'

const RARITIES = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra',
  'Rare Secret', 'Rare Rainbow', 'Promo'
]

const SORT_OPTIONS = [
  { value: 'name', label: 'Nombre A-Z' },
  { value: '-name', label: 'Nombre Z-A' },
  { value: 'set.releaseDate', label: 'Más Recientes' },
  { value: '-set.releaseDate', label: 'Más Antiguos' },
  { value: 'number', label: 'Número' },
]

function CardsPageContent() {
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
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

  // Initialize filters from URL params (only once on mount)
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    const rarityFilter = searchParams.get('rarity')

    const newFilters: Record<string, string> = {}
    
    // Set default search if no query provided
    newFilters.name = searchQuery || 'pokemon'
    if (rarityFilter) newFilters.rarity = rarityFilter

    dispatch(setFilters(newFilters))
  }, [searchParams, dispatch])

  // Fetch data when filters change (prevents double call)
  useEffect(() => {
    if (filters.name) {
      dispatch(fetchCards({ filters }))
    }
  }, [dispatch, filters])

  const handleFilterChange = useCallback((key: string, value: string) => {
    dispatch(setFilters({ [key]: value }))
  }, [dispatch])

  const handlePageChange = useCallback((page: number) => {
    dispatch(setPage(page))
  }, [dispatch])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    dispatch(setPageSize(pageSize))
  }, [dispatch])

  const clearFilters = () => {
    dispatch(setFilters({
      name: '',
      rarity: '',
      orderBy: 'name'
    }))
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.name) count++
    if (filters.rarity) count++
    return count
  }

  // Sort cards to show "EN STOCK" (inStock: true) first
  const sortedCards = useMemo(() => {
    if (!cards || cards.length === 0) return cards
    
    console.log('[CardsPage] Sorting cards - In stock first')
    
    return [...cards].sort((a, b) => {
      // First priority: in-stock cards (check if property exists)
      const aInStock = 'inStock' in a ? a.inStock : false
      const bInStock = 'inStock' in b ? b.inStock : false
      
      if (aInStock && !bInStock) return -1
      if (!aInStock && bInStock) return 1
      
      // If both have same stock status, maintain original order
      return 0
    })
  }, [cards])

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="container-custom py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2 font-thunder">
            {filters.name && filters.name.trim() !== ''
              ? `Resultados para "${filters.name}"`
              : 'Catálogo de Cartas Pokemon'}
          </h1>
          <p className="text-gray-600">
            Explora nuestra colección completa de cartas Pokemon
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtros</h3>
                {getFilterCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Limpiar ({getFilterCount()})
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por nombre
                  </label>
                  <input
                    type="text"
                    value={filters.name || ''}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="input w-full"
                    placeholder="Ej: Pikachu"
                    disabled={loading}
                  />
                  {loading && filters.name && (
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">
                      🔍 Buscando precios en TCGPlayer...
                    </p>
                  )}
                </div>

                {/* Rarity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rareza
                  </label>
                  <select
                    value={filters.rarity || ''}
                    onChange={(e) => handleFilterChange('rarity', e.target.value)}
                    className="input w-full"
                    disabled={loading}
                  >
                    <option value="">Todas las rarezas</option>
                    {RARITIES.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={filters.orderBy || 'name'}
                    onChange={(e) => handleFilterChange('orderBy', e.target.value)}
                    className="input w-full"
                    disabled={loading}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Loading Overlay */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      🔍 Buscando &quot;{filters.name}&quot; en TCGPlayer...
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Obteniendo precios actualizados del mercado
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-white rounded-card shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn btn-outline btn-sm flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filtros
                    {getFilterCount() > 0 && (
                      <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getFilterCount()}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {loading ? (
                      <span className="text-sm text-blue-600 animate-pulse">
                        Cargando...
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {pagination.totalCount} cartas encontradas
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* View mode toggle */}
                  <div className="flex items-center bg-gray-100 rounded-button p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Bars3Icon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Page size */}
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="input w-20"
                  >
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                    <option value={60}>60</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            {loading ? (
              <div className={viewMode === 'grid' ? 'grid-cards' : 'space-y-4'}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-[2.5/3.5] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-8 bg-blue-100 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
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
            ) : sortedCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No se encontraron cartas con estos filtros</p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid-cards' : 'space-y-4'}>
                  {sortedCards.map((card) => (
                    <ProductCard 
                      key={card.id} 
                      card={card}
                      showAddToCart={true}
                      className={viewMode === 'list' ? 'flex flex-row h-32' : ''}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalCount > pagination.pageSize && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="btn btn-outline disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    
                    <span className="text-sm text-gray-600">
                      Página {pagination.page} de {Math.ceil(pagination.totalCount / pagination.pageSize)}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize)}
                      className="btn btn-outline disabled:opacity-50"
                    >
                      Siguiente
                    </button>
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
