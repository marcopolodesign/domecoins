'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { FunnelIcon, Squares2X2Icon, Bars3Icon, CogIcon } from '@heroicons/react/24/outline'
import PokemonCard from '@/components/PokemonCard'
import { RootState } from '@/store'
import { fetchCards, setFilters, setPage, setPageSize, setAPIProvider } from '@/store/productsSlice'
import { fetchSets } from '@/store/productsSlice'

const POKEMON_TYPES = [
  'Colorless', 'Fire', 'Water', 'Lightning', 'Grass', 'Fighting',
  'Psychic', 'Darkness', 'Metal', 'Dragon', 'Fairy'
]

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

export default function CardsPage() {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const { 
    cards, 
    sets, 
    loading, 
    error, 
    filters, 
    pagination,
    currentAPI 
  } = useSelector((state: RootState) => state.products)

  // Initialize filters from URL params
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    const setFilter = searchParams.get('set')
    const typeFilter = searchParams.get('type')
    const rarityFilter = searchParams.get('rarity')

    const newFilters: any = {}
    
    if (searchQuery) newFilters.name = searchQuery
    if (setFilter) newFilters.set = setFilter
    if (typeFilter) newFilters.types = [typeFilter]
    if (rarityFilter) newFilters.rarity = rarityFilter

    if (Object.keys(newFilters).length > 0) {
      dispatch(setFilters(newFilters))
    }
  }, [searchParams, dispatch])

  // Fetch data
  useEffect(() => {
    dispatch(fetchSets() as any)
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchCards({ filters, apiProvider: currentAPI }) as any)
  }, [dispatch, filters, currentAPI])

  const handleFilterChange = useCallback((key: string, value: any) => {
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
      set: '',
      types: [],
      rarity: '',
      orderBy: 'name'
    }))
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.name) count++
    if (filters.set) count++
    if (filters.types && filters.types.length > 0) count++
    if (filters.rarity) count++
    return count
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Catálogo de Cartas Pokemon
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
                  />
                </div>

                {/* Set */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set
                  </label>
                  <select
                    value={filters.set || ''}
                    onChange={(e) => handleFilterChange('set', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Todos los sets</option>
                    {sets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filters.types?.[0] || ''}
                    onChange={(e) => handleFilterChange('types', e.target.value ? [e.target.value] : [])}
                    className="input w-full"
                  >
                    <option value="">Todos los tipos</option>
                    {POKEMON_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Provider Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CogIcon className="inline h-4 w-4 mr-1" />
                    Fuente de Datos
                  </label>
                  <select
                    value={currentAPI}
                    onChange={(e) => dispatch(setAPIProvider(e.target.value))}
                    className="input w-full"
                  >
                    <option value="auto">Automático (Mejor disponible)</option>
                    <option value="pokemon-tcg">Pokemon TCG API (Oficial)</option>
                    <option value="precios-tcg">PreciosTCG (Precios Argentina)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentAPI === 'auto' && 'Usa la mejor API disponible automáticamente'}
                    {currentAPI === 'pokemon-tcg' && 'Datos oficiales de Pokemon TCG con imágenes HD'}
                    {currentAPI === 'precios-tcg' && 'Precios en pesos argentinos actualizados'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
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
                    <span className="text-sm text-gray-500">
                      {pagination.totalCount} cartas encontradas
                    </span>
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
                {[...Array(pagination.pageSize)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="aspect-card bg-gray-200 rounded-t-card"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error al cargar las cartas</p>
                <button
                  onClick={() => dispatch(fetchCards({ filters, apiProvider: currentAPI }) as any)}
                  className="btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No se encontraron cartas con estos filtros</p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid-cards' : 'space-y-4'}>
                  {cards.map((card) => (
                    <PokemonCard 
                      key={card.id} 
                      card={card}
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
