
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

import { 
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { addToCart, openCart, MAX_QUANTITY_PER_VARIANT } from '@/store/cartSlice'
import { RootState } from '@/store'
import toast from 'react-hot-toast'
import { getRoundedArsPrice } from '@/utils/priceFormatting'

interface ProductCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  card: any // Accepts both PokemonCard and unified Card types
  showAddToCart?: boolean
  className?: string
  backgroundColor?: string
  style?: React.CSSProperties
}

export default function ProductCard({ 
  card, 
  showAddToCart = true, 
  className = '',
  backgroundColor = 'bg-white',
  style
}: ProductCardProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const dolarBlueRate = useSelector((state: RootState) => state.currency.dolarBlueRate)
  const cartItems = useSelector((state: RootState) => state.cart.items)

  // Extract price - works with both card formats
  const getPrice = () => {
    // Try TCGPlayer pricing first (from search-with-prices API)
    // Use retailPrice (with formula) if available, otherwise use marketPrice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((card.pricing as any)?.retailPrice) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (card.pricing as any).retailPrice
    }
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
  const arsPrice = usdPrice ? getRoundedArsPrice(usdPrice * dolarBlueRate) : null
  
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!usdPrice) {
      toast.error('Precio no disponible para esta carta')
      return
    }

    // Get the printing variant (featured/primary variant from TCGPlayer)
    const printing = card.printing || 'Normal';
    
    // Create unique ID based on productId AND printing to differentiate variants
    const productId = card.productId || card.id;
    const uniqueId = `${productId}-${printing.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if cart already has 3 of this variant
    const existingItem = cartItems.find(item => item.card.id === uniqueId);
    if (existingItem && existingItem.quantity >= MAX_QUANTITY_PER_VARIANT) {
      toast.error('Ya tenés el máximo de 3 variantes de este producto en tu carrito');
      return;
    }

    setIsLoading(true)
    
    try {
      dispatch(addToCart({
        card: {
          ...card,
          id: uniqueId, // Unique per printing variant
          printing: printing, // Ensure printing is explicitly set
          productId: productId, // Preserve numeric productId for navigation
        },
        priceUsd: usdPrice,
        priceArs: arsPrice!,
        inStock: card.inStock ?? true, // Default to true if not specified
      }))
      
      // Auto-open the cart after adding item
      dispatch(openCart())
      
      toast.success(`${card.name} agregado al carrito`)
    } catch {
      toast.error('Error al agregar al carrito')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCardClick = () => {
    // Extract productId - try different possible fields
    const productId = card.productId || card.id;
    
    if (productId) {
      router.push(`/cards/${productId}`);
    }
  }


  // Get image URL
  const imageUrl = card.imageUrl || card.images?.large || card.images?.small || '/placeholder-card.svg'
  const setName = card.categoryName || card.set?.name || 'Unknown Set'

  return (
    <div 
      onClick={handleCardClick}
      className={`group ${backgroundColor} transition-all duration-300 flex flex-col p-4 border border-transparent hover:border-blue-500 hover:shadow-md rounded-lg w-full max-w-sm cursor-pointer ${className}`}
      style={style}
    >
      {/* Top section with image and details */}
      <div className="flex flex-row flex-1">
        {/* Card image - Left side (TCG dimensions: 144x201) */}
        <div className="relative w-36 h-50 bg-gray-100 flex-shrink-0 rounded-lg" style={{ width: '144px', height: '201px' }}>
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover group-hover:scale-105  transition-transform duration-300 group-hover:shadow-md rounded-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-card.svg'
            }}
          />
        </div>

        {/* Card details - Right side */}
        <div className="flex-1 flex flex-col justify-between min-h-50 p-4" style={{ minHeight: '201px' }}>
          {/* Top section */}
          <div>
            {/* Stock Status */}
            <div>
              {card.inStock ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">EN STOCK</span>
                  {card.stock && card.stock > 1 && (
                    <span className="text-sm text-gray-500">({card.stock} unidades)</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600 font-medium">POR ENCARGO</span>
                </div>
              )}
            </div>

            {/* Card name */}
            <h3 className={`${card.name.length > 20 ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900`}>
              {card.name}
            </h3>

            {/* Rarity, Printing, and Set info */}
            <div className="flex items-center gap-3">
              {card.rarity && (
                <span className="text-sm text-gray-600">
                  {card.rarity}
                  {card.printing && ` • ${card.printing}`}, #{card.setId || 'N/A'}
                </span>
              )}
            </div>

            {/* Rarity and Set icons */}
            <div className="flex items-center gap-4">
              {/* {card.rarity && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700">{card.rarity}</span>
                </div>
              )} */}
              <div className="flex items-center gap-2">
                {/* <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div> */}
                <span className="text-sm text-gray-700">{setName}</span>
              </div>
            </div>
          </div>

          {/* Bottom section - Price only */}
          <div>
            {/* Price */}
            {usdPrice ? (
              <div>
                <span className="text-2xl font-bold text-gray-900 font-thunder">
                  AR$ {arsPrice!.toLocaleString('es-AR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  })}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-base text-gray-400">Consultá precio</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Add to cart button at bottom */}
      {showAddToCart && usdPrice && (
        <div className="border-t border-gray-100 rounded-bl-lg rounded-br-lg -mx-4 -mb-4 mt-4">
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-gray-200 group-hover:bg-blue-600 text-gray-700 group-hover:text-white font-semibold py-3 rounded-bl-lg rounded-br-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {isLoading ? 'Agregando...' : 'Agregar al carrito'}
          </button>
        </div>
      )}
    </div>
  )
}


