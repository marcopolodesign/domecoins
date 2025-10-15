'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Interface for TCGPlayer card data
interface TCGPlayerCard {
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

interface ReusableCardsBlockProps {
  title?: string;
  subtitle?: string;
  cardIds?: number[];
  randomCount?: number;
  className?: string;
  showRefreshButton?: boolean;
  showFloatingButton?: boolean;
  floatingButtonText?: string;
  floatingButtonHref?: string;
}

export default function ReusableCardsBlock({ 
  title,
  subtitle,
  cardIds = [], 
  randomCount = 5,
  className = "",
  showRefreshButton = false,
  showFloatingButton = false,
  floatingButtonText = "Ver Todas las Cartas",
  floatingButtonHref = "/cards"
}: ReusableCardsBlockProps) {
  const [featuredCards, setFeaturedCards] = useState<TCGPlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch featured cards from local JSON data
  useEffect(() => {
    const fetchFeaturedCards = async () => {
      try {
        setLoading(true);
        
        // Fetch from local JSON file
        const response = await fetch('/data/tcgplayer-featured-cards.json');
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0 && data.results[0].results) {
            const allCards = data.results[0].results;
            
            let selectedCards;
            
            // If specific card IDs provided, filter by those IDs
            if (cardIds.length > 0) {
              selectedCards = allCards
                .filter((card: TCGPlayerCard) => cardIds.includes(card.productId))
                .map((result: TCGPlayerCard) => ({
                  productId: result.productId,
                  productName: result.productName,
                  marketPrice: result.marketPrice || result.lowestPrice || 0,
                  lowestPrice: result.lowestPrice || 0,
                  setName: result.setName || 'Unknown Set',
                  rarityName: result.rarityName || 'Unknown',
                  customAttributes: result.customAttributes || { cardType: [], energyType: [] }
                }));
            } else {
              // Randomly select cards from the available cards
              const shuffled = [...allCards].sort(() => 0.5 - Math.random());
              selectedCards = shuffled.slice(0, randomCount).map((result: TCGPlayerCard) => ({
                productId: result.productId,
                productName: result.productName,
                marketPrice: result.marketPrice || result.lowestPrice || 0,
                lowestPrice: result.lowestPrice || 0,
                setName: result.setName || 'Unknown Set',
                rarityName: result.rarityName || 'Unknown',
                customAttributes: result.customAttributes || { cardType: [], energyType: [] }
              }));
            }
            
            setFeaturedCards(selectedCards);
          }
        }
      } catch (error) {
        console.error('Error fetching featured cards:', error);
        // Fallback to placeholder cards
        setFeaturedCards([
          {
            productId: 250309,
            productName: 'Mew',
            marketPrice: 4.22,
            lowestPrice: 0.62,
            setName: 'Celebrations',
            rarityName: 'Holo Rare',
            customAttributes: { cardType: ['Pokemon'], energyType: ['Psychic'] }
          },
          {
            productId: 250314,
            productName: 'Groudon',
            marketPrice: 0.40,
            lowestPrice: 0.04,
            setName: 'Celebrations',
            rarityName: 'Holo Rare',
            customAttributes: { cardType: ['Pokemon'], energyType: ['Fighting'] }
          },
          {
            productId: 250300,
            productName: 'Ho-Oh',
            marketPrice: 0.27,
            lowestPrice: 0.01,
            setName: 'Celebrations',
            rarityName: 'Holo Rare',
            customAttributes: { cardType: ['Pokemon'], energyType: ['Fire'] }
          },
          {
            productId: 250317,
            productName: 'Lugia',
            marketPrice: 0.81,
            lowestPrice: 0.06,
            setName: 'Celebrations',
            rarityName: 'Holo Rare',
            customAttributes: { cardType: ['Pokemon'], energyType: ['Colorless'] }
          },
          {
            productId: 250303,
            productName: 'Pikachu',
            marketPrice: 5.29,
            lowestPrice: 1.99,
            setName: 'Celebrations',
            rarityName: 'Holo Rare',
            customAttributes: { cardType: ['Pokemon'], energyType: ['Lightning'] }
          }
        ].slice(0, randomCount));
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Function to refresh cards with new random selection
  const refreshCards = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <section className={`relative ${className}`}>
      <div className="container-custom">
        {/* Title and subtitle section */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <h2 className="text-3xl font-bold text-gray-900 font-thunder">
                  {title}
                </h2>
                {showRefreshButton && (
                  <button
                    onClick={refreshCards}
                    disabled={loading}
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50"
                    title="Ver nuevas cartas aleatorias"
                  >
                    <svg 
                      className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 font-interphases">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {/* Cards display - Grid layout matching Figma design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            // Loading skeleton
            [...Array(randomCount)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse">
                <div className="aspect-[2.5/3.5] bg-gradient-to-br from-gray-200 to-gray-300">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-400 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            featuredCards.map((card) => {
              // Get card type from customAttributes
              const cardType = card.customAttributes?.cardType?.[0] || 'Pokemon';
              const energyType = card.customAttributes?.energyType?.[0] || '';
              const cardNumber = card.productId.toString().slice(-3);
              
              return (
                <div
                  key={card.productId}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group"
                >
                  {/* Card Image */}
                  <div className="relative aspect-[2.5/3.5] overflow-hidden bg-gray-100">
                    <img
                      src={`https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg`}
                      alt={card.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pokemontcg.io/250300/hires.png';
                      }}
                    />
                  </div>
                  
                  {/* Card Info */}
                  <div className="p-4">
                    {/* Card Name and Stock */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                        {card.productName}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">EN STOCK</span>
                      </div>
                    </div>
                    
                    {/* Rarity and Card Number */}
                    <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {card.rarityName}
                      </span>
                      <span>#{cardNumber}/025</span>
                    </div>
                    
                    {/* Set Name */}
                    <div className="text-xs text-gray-500 mb-4">
                      {card.setName}
                    </div>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        ${card.marketPrice.toFixed(3)}
                      </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Floating action button */}
        {showFloatingButton && (
          <div className="text-center mt-16">
            <Link 
              href={floatingButtonHref} 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {floatingButtonText}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

