
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { HeartIcon, ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { addToCart } from '@/store/cartSlice'
import { RootState } from '@/store'
import toast from 'react-hot-toast'

interface ProductCardProps {
  card: any // Accepts both PokemonCard and unified Card types
  showAddToCart?: boolean
  className?: string
}

export default function ProductCard({ 
  card, 
  showAddToCart = true, 
  className = '' 
}: ProductCardProps) {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const dolarBlueRate = useSelector((state: RootState) => state.currency.dolarBlueRate)

  // Extract price - works with both card formats
  const getPrice = () => {
    // Try TCGPlayer pricing first (from search-with-prices API)
    if (card.pricing?.marketPrice) {
      return card.pricing.marketPrice
    }
    
    // Try offers array
    if (card.offers && card.offers.length > 0) {
      const firstOffer = card.offers[0]
      const match = firstOffer.match(/\$?([\d.]+)/)
      if (match) return parseFloat(match[1])
    }
    
    // Try tcgplayer data
    if (card.tcgplayer?.prices) {
      const prices = card.tcgplayer.prices
      if (prices.holofoil?.market) return prices.holofoil.market
      if (prices.normal?.market) return prices.normal.market
      if (prices.holofoil?.mid) return prices.holofoil.mid
      if (prices.normal?.mid) return prices.normal.mid
    }
    
    return null
  }

  const usdPrice = getPrice()
  const arsPrice = usdPrice ? usdPrice * dolarBlueRate : null
  
  // Log pricing for debugging
  if (usdPrice) {
    console.log(`[ProductCard] ${card.name}:`, {
      usdPrice,
      dolarBlueRate,
      arsPrice,
      stock: card.stock,
      inStock: card.inStock
    });
  }

  const handleAddToCart = async () => {
    if (!usdPrice) {
      toast.error('Precio no disponible para esta carta')
      return
    }

    setIsLoading(true)
    
    try {
      dispatch(addToCart({
        card,
        priceUsd: usdPrice,
        priceArs: arsPrice!,
      }))
      
      toast.success(`${card.name} agregado al carrito`)
    } catch (error) {
      toast.error('Error al agregar al carrito')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removido de favoritos' : 'Agregado a favoritos')
  }

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'text-gray-500'
    
    const rarityLower = rarity.toLowerCase()
    if (rarityLower.includes('common')) return 'text-gray-600'
    if (rarityLower.includes('uncommon')) return 'text-green-600'
    if (rarityLower.includes('rare')) return 'text-blue-600'
    if (rarityLower.includes('ultra')) return 'text-purple-600'
    if (rarityLower.includes('secret')) return 'text-yellow-600'
    return 'text-gray-500'
  }

  // Get image URL
  const imageUrl = card.imageUrl || card.images?.large || card.images?.small || '/placeholder-card.svg'
  const setName = card.categoryName || card.set?.name || 'Unknown Set'

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="relative group">
        {/* Card image */}
        <div className="aspect-[2.5/3.5] relative overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-card.svg'
            }}
          />
        </div>

        {/* Favorite button - Hidden for now */}
        {/* <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all hover:scale-110"
        >
          {isFavorite ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600" />
          )}
        </button> */}

        {/* Pokemon types */}
        {card.types && card.types.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {card.types.slice(0, 2).map((type: string) => (
              <span
                key={type}
                className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm shadow-sm"
                style={{
                  color: getTypeColor(type)
                }}
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* TCGPlayer badge - Hidden for now */}
        {/* {card.pricing?.source === 'TCGPlayer' && (
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-md flex items-center gap-1">
              <SparklesIcon className="h-3 w-3" />
              Precio Real
            </span>
          </div>
        )} */}
      </div>

      {/* Card details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {card.name}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {setName}
        </p>

        {/* Stock Status */}
        <div className="mb-3">
          {card.inStock ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">EN STOCK</span>
              {card.stock && card.stock > 1 && (
                <span className="text-xs text-gray-500">({card.stock} unidades)</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-yellow-600 font-medium">ENCARGO</span>
            </div>
          )}
        </div>

        {/* HP and Rarity */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {card.hp && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
              {card.hp} HP
            </span>
          )}
          {card.rarity && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(card.rarity)}`}>
              {card.rarity}
            </span>
          )}
        </div>

        {/* Price */}
        {usdPrice ? (
          <div className="mb-4">
            <span className="text-2xl font-bold text-gray-900">
              AR${arsPrice!.toLocaleString('es-AR', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </span>
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-sm text-gray-400">Consultá precio</span>
          </div>
        )}

        {/* Add to cart button */}
        {showAddToCart && usdPrice && (
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
          </button>
        )}
      </div>
    </div>
  )
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Grass: '#78C850',
    Fire: '#F08030',
    Water: '#6890F0',
    Lightning: '#F8D030',
    Psychic: '#F85888',
    Fighting: '#C03028',
    Darkness: '#705848',
    Metal: '#B8B8D0',
    Dragon: '#7038F8',
    Fairy: '#EE99AC',
    Colorless: '#A8A878',
  }
  return colors[type] || '#68A090'
}

