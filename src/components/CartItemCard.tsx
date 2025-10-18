'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'

interface CartItemCardProps {
  card: any // Same as ProductCard - accepts both PokemonCard and unified Card types
  quantity: number
  priceArs: number
  onRemoveItem: (cardId: string) => void
  onClose: () => void
}

export default function CartItemCard({ 
  card, 
  quantity,
  priceArs,
  onRemoveItem,
  onClose
}: CartItemCardProps) {
  // Get image URL using same fallback pattern as ProductCard
  const imageUrl = card.imageUrl || card.images?.large || card.images?.small || '/placeholder-card.svg'
  
  // Get set name using same fallback pattern as ProductCard
  const setName = card.categoryName || card.set?.name || 'Unknown Set'
  
  // Get card number - handle both TCGPlayer and PokemonCard structures
  const cardNumber = card.setId || card.number || 'N/A'

  return (
    <li className="flex py-6">
      {/* Card Image */}
      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <Image
          src={imageUrl}
          alt={card.name}
          width={64}
          height={96}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Card Details */}
      <div className="ml-4 flex flex-1 flex-col">
        <div>
          {/* Card Name and Price */}
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>
              <Link href={`/cards/${card.id}`} onClick={onClose}>
                {card.name}
              </Link>
            </h3>
            <div className="ml-4 text-right">
              <p className="font-medium">
                AR$ {priceArs.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
          
          {/* Set and Card Number */}
          <p className="mt-1 text-sm text-gray-500">
            {setName} #{cardNumber}
          </p>
          
          {/* Rarity */}
          {card.rarity && (
            <p className="text-xs text-gray-400 capitalize">
              {card.rarity}
            </p>
          )}
        </div>
        
        {/* Remove Button */}
        <div className="flex flex-1 items-end justify-end text-sm">
          <button
            type="button"
            onClick={() => onRemoveItem(card.id)}
            className="p-1 text-red-600 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  )
}
