'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { PokemonCard as PokemonCardType, pokemonAPI } from '@/lib/pokemon-api'
import { currencyAPI } from '@/lib/currency-api'
import { addToCart } from '@/store/cartSlice'
import { RootState } from '@/store'
import toast from 'react-hot-toast'

interface PokemonCardProps {
  card: PokemonCardType
  showAddToCart?: boolean
  className?: string
}

export default function PokemonCard({ 
  card, 
  showAddToCart = true, 
  className = '' 
}: PokemonCardProps) {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [priceData, setPriceData] = useState<{
    usd: string
    ars: string
    rate: number
  } | null>(null)
  
  const dolarBlueRate = useSelector((state: RootState) => state.currency.dolarBlueRate)

  // Get price from card data
  const usdPrice = pokemonAPI.getCardPrice(card)
  
  // Format prices
  const formatPrices = async (usdPrice: number) => {
    if (priceData) return priceData
    
    const formatted = await currencyAPI.formatPrice(usdPrice)
    setPriceData(formatted)
    return formatted
  }

  const handleAddToCart = async () => {
    if (!usdPrice) {
      toast.error('Precio no disponible para esta carta')
      return
    }

    setIsLoading(true)
    
    try {
      const arsPrice = usdPrice * dolarBlueRate
      
      dispatch(addToCart({
        card,
        priceUsd: usdPrice,
        priceArs: arsPrice,
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

  return (
    <div className={`card-product ${className}`}>
      <div className="relative">
        {/* Card image */}
        <div className="aspect-card w-full overflow-hidden bg-gray-100">
          <Image
            src={card.images.small}
            alt={card.name}
            width={245}
            height={342}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>

        {/* Favorite button - Hidden for now */}
        {/* <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
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
            {card.types.map((type) => (
              <span
                key={type}
                className={`type-${type.toLowerCase()} text-xs px-2 py-1 rounded-full font-medium`}
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Rarity badge */}
        {card.rarity && (
          <div className="absolute bottom-2 left-2">
            <span className={`text-xs font-medium ${getRarityColor(card.rarity)}`}>
              {card.rarity}
            </span>
          </div>
        )}
      </div>

      {/* Card details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
            {card.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            #{card.number}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          {card.set.name}
        </p>

        {/* HP and attacks info */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          {card.hp && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
              {card.hp} HP
            </span>
          )}
          {card.attacks && card.attacks.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {card.attacks.length} {card.attacks.length === 1 ? 'Ataque' : 'Ataques'}
            </span>
          )}
        </div>

        {/* Price */}
        {usdPrice ? (
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                AR${(usdPrice * dolarBlueRate).toLocaleString('es-AR', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <span className="text-sm text-gray-400">Precio no disponible</span>
          </div>
        )}

        {/* Add to cart button */}
        {showAddToCart && usdPrice && (
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full btn btn-primary btn-sm flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon className="h-4 w-4" />
            {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
          </button>
        )}
      </div>
    </div>
  )
}
