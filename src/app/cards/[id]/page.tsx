'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, openCart } from '@/store/cartSlice';
import { ShoppingCartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { TCGPlayerPrice, TCGPlayerVariant } from '@/lib/tcgplayer-price-scraper';
import { getTypeGradient } from '@/utils/pokemonTypeGradients';
import VanillaTilt from 'vanilla-tilt';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dolarBlueRate = useAppSelector((state) => state.currency.dolarBlueRate);
  
  const [card, setCard] = useState<TCGPlayerPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<TCGPlayerVariant | null>(null);
  const cardImageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cards/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Card not found');
        }
        
        const data = await response.json();
        setCard(data);
        
        // Select first variant by default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error('Error fetching card:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchCard();
    }
  }, [params.id]);
  
  // Initialize VanillaTilt on card image
  useEffect(() => {
    if (cardImageRef.current && !loading) {
      VanillaTilt.init(cardImageRef.current, {
        max: 5,
        speed: 500,
        perspective: 2000,
      });
      
      // Cleanup on unmount
      return () => {
        if (cardImageRef.current && (cardImageRef.current as any).vanillaTilt) {
          (cardImageRef.current as any).vanillaTilt.destroy();
        }
      };
    }
  }, [loading, card]);
  
  const formatPrice = (priceUSD?: number) => {
    if (!priceUSD) return 'N/A';
    
    // Always show ARS price using exchange rate
    const priceARS = priceUSD * dolarBlueRate;
    return `AR$ ${priceARS.toLocaleString('es-AR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };
  
  const handleAddToCart = (variant: TCGPlayerVariant) => {
    if (!card) return;
    
    // Always use marketPrice (average price)
    const price = variant.marketPrice || 0;
    
    dispatch(addToCart({
      card: {
        id: `${card.productId}-${variant.productId}`,
        name: card.productName,
        images: {
          small: card.imageUrl,
          large: card.imageUrl,
        },
        set: {
          name: card.setName,
          id: card.setId.toString(),
        },
        number: card.cardNumber || 'N/A',
        rarity: `${card.rarity || 'Unknown'} - ${variant.printing}`,
        // TCGPlayer-specific fields
        imageUrl: card.imageUrl,
        categoryName: card.setName,
        setId: card.cardNumber || 'N/A',
        inStock: variant.inStock,
      } as any,
      quantity: 1,
      priceUsd: price,
      priceArs: price * dolarBlueRate,
      inStock: variant.inStock,
    }));
    
    dispatch(openCart());
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[144/201] bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!card) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Card Not Found</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  const currentVariant = selectedVariant || card.variants?.[0];
  // Always use marketPrice (average), never lowestPrice
  const currentPrice = currentVariant?.marketPrice || card.marketPrice || 0;
  
  return (
    <div className="min-h-screen bg-white pt-32 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-interphases">Volver</span>
        </button>
        
        {/* Card Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Image with Gradient Background */}
          <div 
            className="flex justify-center rounded-lg p-8 lg:p-10 h-max"
            style={{ 
              background: getTypeGradient(card.energyType)
            }}
          >
            <div 
              className="lg:sticky lg:top-24 self-start"
              style={{ width: '290px', height: '422px' }}
            >
              <img
                ref={cardImageRef}
                src={`https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg`}
                srcSet={`
                  https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_200x200.jpg 200w,
                  https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg 400w,
                  https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_600x600.jpg 600w,
                  https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_800x800.jpg 800w
                `}
                sizes="(max-width: 290px) 100vw, 290px"
                alt={card.productName}
                className="rounded-lg object-cover w-full h-full"
                loading="eager"
              />
            </div>
          </div>
          
          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Title & Set */}
            <div>
              <h1 className="text-5xl font-thunder mb-2">
                {card.productName}
              </h1>
              <p className="text-xl text-gray-600 font-interphases">
                {card.setName} {card.cardNumber ? `#${card.cardNumber}` : ''}
              </p>
              {card.rarity && (
                <p className="text-sm text-gray-500 font-interphases capitalize mt-1">
                  {card.rarity}
                </p>
              )}
            </div>
            
            {/* Stats */}
            {(card.hp || card.energyType) && (
              <div className="flex gap-4 items-center">
                {card.hp && (
                  <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-interphases font-bold">
                    HP {card.hp}
                  </div>
                )}
                {card.energyType && card.energyType.length > 0 && (
                  <div className="flex gap-2">
                    {card.energyType.map((type, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-interphases capitalize"
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-interphases font-bold mb-2">Ataques</h3>
                <ul className="space-y-2">
                  {card.attacks.map((attack, idx) => (
                    <li key={idx} className="text-gray-700 font-interphases">
                      • {attack}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Variants Selection */}
            {card.variants && card.variants.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-2xl font-thunder mb-4">Versiones Disponibles</h3>
                <div className="space-y-3">
                  {card.variants.map((variant, idx) => {
                    const isSelected = selectedVariant?.productId === variant.productId;
                    // Always show marketPrice
                    const variantPrice = variant.marketPrice;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-interphases font-bold text-lg">
                              {variant.printing}
                            </p>
                            {variant.condition && variant.condition !== 'Near Mint' && (
                              <p className="text-sm text-gray-500 font-interphases">
                                {variant.condition}
                              </p>
                            )}
                            <p className={`text-sm font-interphases ${variant.inStock ? 'text-green-600' : 'text-orange-600'}`}>
                              {variant.inStock ? '✓ En Stock' : '⏱ Por Encargo'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-thunder">
                              {formatPrice(variantPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Add to Cart */}
            <div className="border-t pt-6">
              {currentVariant ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-interphases mb-1">Precio seleccionado:</p>
                    <p className="text-4xl font-thunder">
                      {formatPrice(currentPrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(currentVariant)}
                    className="w-full py-4 rounded-lg font-interphases font-bold text-lg flex items-center justify-center gap-3 transition-all bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <ShoppingCartIcon className="w-6 h-6" />
                    Agregar al Carrito
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-interphases">No hay versiones disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

