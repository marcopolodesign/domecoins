'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, openCart } from '@/store/cartSlice';
import { ShoppingCartIcon, ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
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
        
        // Fetch inventory stock for this product
        try {
          const inventoryResponse = await fetch(`/api/inventory/${params.id}`);
          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            console.log('[CardDetail] Inventory stock for', params.id, ':', inventoryData.variants);
            
            // Update variants with actual stock status
            if (data.variants && data.variants.length > 0) {
              const updatedVariants = data.variants.map((v: TCGPlayerVariant) => ({
                ...v,
                inStock: (inventoryData.variants[v.printing] || 0) > 0,
                stockQuantity: inventoryData.variants[v.printing] || 0,
              }));
              data.variants = updatedVariants;
            }
          }
        } catch (invError) {
          console.error('[CardDetail] Error fetching inventory:', invError);
        }
        
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
    const currentRef = cardImageRef.current;
    if (currentRef && !loading) {
      VanillaTilt.init(currentRef, {
        max: 10,
        speed: 500,
        perspective: 3000,
      });
      
      // Cleanup on unmount
      return () => {
        const tiltInstance = (currentRef as HTMLImageElement & { vanillaTilt?: { destroy: () => void } });
        if (tiltInstance.vanillaTilt) {
          tiltInstance.vanillaTilt.destroy();
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

  // Clean HTML tags from text (e.g., <br>, <br/>, etc.)
  const cleanText = (text: string) => {
    if (!text) return text;
    return text.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
  };
  
  const handleAddToCart = (variant: any) => {
    if (!card) return;
    
    // Use retailPrice (with formula applied), fallback to marketPrice
    const price = variant.retailPrice || variant.marketPrice || 0;
    
    // Create unique ID based on productId AND printing to differentiate variants
    const uniqueId = `${card.productId}-${variant.printing.toLowerCase().replace(/\s+/g, '-')}`;
    
    dispatch(addToCart({
      card: {
        id: uniqueId, // Unique per printing variant
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
        printing: variant.printing, // Store printing for cart display
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
  // Use retailPrice (with formula applied), fallback to marketPrice
  const currentPrice = (currentVariant as any)?.retailPrice || currentVariant?.marketPrice || (card as any).retailPrice || card.marketPrice || 0;
  
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
            className="flex justify-center rounded-lg py-12 p-8 lg:p-10 h-max relative"
            style={{ 
              background: getTypeGradient(card.energyType)
            }}
          >
            {/* Card Type Badge */}
            {card.energyType && card.energyType.length > 0 && (
              <div className="absolute top-4 left-4 bg-white/90 text-gray-800 px-3 py-1.5 rounded-md font-interphases font-semibold text-sm shadow-sm">
                {card.energyType[0]}
              </div>
            )}
            
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
                className="rounded-lg object-cover w-full h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                loading="eager"
              />
            </div>
          </div>
          
          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Title & Basic Info */}
            <div>
              <h1 className="text-5xl font-thunder mb-4">
                {card.productName}
              </h1>
              
              {/* Set Name & Rarity */}
              <div className="space-y-2">
                {card.setName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-interphases font-semibold">Set:</span>
                    <span className="text-gray-800 font-interphases">{card.setName}</span>
                  </div>
                )}
                {card.rarity && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-interphases font-semibold">Rarity:</span>
                    <span className="text-gray-800 font-interphases capitalize">{card.rarity}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Information Dropdown */}
            <div className="border-t pt-4">
              <button
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                className="w-full flex items-center justify-between text-left group"
              >
                <h3 className="text-lg font-interphases font-bold">Información Adicional</h3>
                <ChevronDownIcon 
                  className={`w-5 h-5 transition-transform ${isInfoExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isInfoExpanded && (
                <div className="mt-4 space-y-4">
                  {/* Card Number / Rarity */}
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-800 font-interphases font-semibold">Card Number / Rarity:</span>
                      <span className="text-gray-600 font-interphases">
                        {card.cardNumber || 'N/A'} / {card.rarity || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Type / HP / Stage */}
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-800 font-interphases font-semibold">Card Type / HP / Stage:</span>
                      <span className="text-gray-600 font-interphases">
                        {card.energyType?.[0] || 'N/A'} / {card.hp || 'N/A'} / {(card.customAttributes as any)?.stage || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Illustrator */}
                  {(card.customAttributes as any)?.artist && (
                    <div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-800 font-interphases font-semibold">Illustrator:</span>
                        <span className="text-gray-600 font-interphases">
                          {(card.customAttributes as any).artist}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Attacks */}
                  {card.attacks && card.attacks.length > 0 && (
                    <div>
                      <h4 className="text-gray-800 font-interphases font-semibold mb-2">Ataques:</h4>
                      <ul className="space-y-2 pl-4">
                        {card.attacks.map((attack, idx) => (
                          <li key={idx} className="text-gray-600 font-interphases text-sm">
                            • {cleanText(attack)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Variants Selection */}
            {card.variants && card.variants.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-2xl font-thunder mb-4">Versiones Disponibles</h3>
                <div className="space-y-3">
                  {card.variants.map((variant, idx) => {
                    // Compare by printing to differentiate variants of the same product
                    const isSelected = selectedVariant?.printing === variant.printing;
                    // Show retailPrice (with formula applied), fallback to marketPrice
                    const variantPrice = (variant as any).retailPrice || variant.marketPrice;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-transparent bg-gray-50 hover:border-blue-600'
                          }
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`font-interphases font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {variant.printing}
                            </p>
                            {variant.condition && variant.condition !== 'Near Mint' && (
                              <p className={`text-sm font-interphases ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                {variant.condition}
                              </p>
                            )}
                            <p className={`text-sm font-interphases font-semibold ${
                              isSelected 
                                ? 'text-white' 
                                : variant.inStock 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                            }`}>
                              {variant.inStock ? '✓ En Stock' : '⏱ Por Encargo'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-thunder ${isSelected ? 'text-white' : 'text-gray-900'}`}>
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

