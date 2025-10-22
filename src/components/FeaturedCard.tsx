'use client';

import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { calculateFinalPrice } from '@/utils/priceFormulas';
import { getRoundedArsPrice } from '@/utils/priceFormatting';

interface FeaturedCardProps {
  productId: number;
  productName: string;
  marketPrice: number;
  lowestPrice: number;
  setName: string;
  rarityName: string;
  customAttributes: {
    cardType: string[];
    energyType: string[];
  };
}

export default function FeaturedCard({
  productId,
  productName,
  marketPrice,
  setName,
  rarityName,
}: FeaturedCardProps) {
  const cardNumber = productId.toString().slice(-3);
  const dolarBlueRate = useSelector((state: RootState) => state.currency.dolarBlueRate);

  // Calculate retail price using the formula (same as ProductCard)
  const retailPrice = calculateFinalPrice(rarityName, marketPrice);
  
  // Convert to ARS and round
  const arsPrice = getRoundedArsPrice(retailPrice * dolarBlueRate);

  return (
    <div className="w-full md:w-[30%] bg-white rounded-lg hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 h-auto lg:h-[280px] group">
      <div className="flex flex-col lg:flex-row w-full h-full">
        {/* Card Image - Left Side */}
        <div className="w-full lg:w-1/2 flex-shrink-0 aspect-[5/7] lg:aspect-auto lg:h-full relative">
          <div className="relative w-full h-full overflow-hidden bg-gray-100">
            <Image
              src={`https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_400x400.jpg`}
              alt={productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
            
            {/* Add to Cart Button Overlay - Shows on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 items-center justify-center">
              <button className="flex flex-col items-center justify-center text-white py-4 px-8 rounded-lg hover:text-yellow-300 gap-3 text-lg font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
        
        {/* Card Info - Right Side */}
        <div className="flex flex-col justify-between w-full lg:w-1/2">
          <div className="p-4 lg:p-6">
            {/* Card Name */}
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {productName}, {setName}
            </h3>
            
            {/* Rarity and Card Number */}
            <div className="text-md text-gray-700 mb-1">
              {rarityName}, #{cardNumber}
            </div>
            
            <div className="flex flex-col gap-2 my-4">
              {/* Stock Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">EN STOCK</span>
              </div>
              
              {/* Icon Rows */}
              <div className="space-y-2">
                {/* Rarity Icon */}
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                  </svg>
                  <span className="text-xs text-blue-600 font-medium uppercase">{rarityName}</span>
                </div>   
              </div>
            </div>
            
            {/* Price */}
            <div className="text-3xl font-thunder font-bold text-gray-900">
              AR$ {arsPrice.toLocaleString('es-AR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

