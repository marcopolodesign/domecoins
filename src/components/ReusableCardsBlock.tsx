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
        
        {/* Cards display - Horizontal layout with image on left and info on right */}
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          {loading ? (
            // Loading skeleton
            [...Array(randomCount)].map((_, index) => (
              <div key={index} className="w-full md:w-[30%] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse h-auto lg:h-[280px]">
                <div className="flex flex-col lg:flex-row w-full h-full">
                  {/* Card Image Skeleton */}
                  <div className="w-full lg:w-1/2 h-64 lg:h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-400 rounded-full animate-pulse"></div>
                  </div>
                  {/* Card Info Skeleton */}
                  <div className="flex-1 p-4 lg:p-6 space-y-4 w-full lg:w-1/2">
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-400 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            featuredCards.map((card) => {
              // Get card number from product ID
              const cardNumber = card.productId.toString().slice(-3);
              
              return (
                <div
                  key={card.productId}
                  className="w-full md:w-[30%] bg-white rounded-lg hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 h-auto lg:h-[280px] group"
                >
                  <div className="flex flex-col lg:flex-row w-full h-full">
                    {/* Card Image - Left Side */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 h-64 lg:h-full relative">
                      <div className="relative w-full h-full overflow-hidden bg-gray-100">
                        <img
                          src={`https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg`}
                          alt={card.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pokemontcg.io/250300/hires.png';
                          }}
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
                          {card.productName}, {card.setName}
                        </h3>
                        
                        {/* Rarity and Card Number */}
                        <div className="text-md text-gray-700 mb-1">
                          {card.rarityName}, #{cardNumber}
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
                              <span className="text-xs text-blue-600 font-medium uppercase">{card.rarityName}</span>
                            </div>   
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="text-3xl font-thunder font-bold text-gray-900">
                          ${card.marketPrice.toFixed(3)}
                        </div>
                      </div>
                    </div>
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

