'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRightIcon, SparklesIcon, TruckIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import SearchBox from '@/components/SearchBox';
import ReusableCardsBlock from '@/components/ReusableCardsBlock';

const features = [
  {
    name: 'Precios en Pesos',
    description: 'Todos los precios en pesos argentinos con el dólar blue actualizado en tiempo real.',
    icon: CreditCardIcon,
  },
  {
    name: 'Envíos Seguros',
    description: 'Envíos a todo el país con Andreani, seguimiento incluido.',
    icon: TruckIcon,
  },
  {
    name: 'Cartas Auténticas',
    description: 'Todas nuestras cartas son 100% originales y en excelente estado.',
    icon: SparklesIcon,
  },
];

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

export default function HomePage() {
  const [featuredCards, setFeaturedCards] = useState<TCGPlayerCard[]>([]);
  const [loading, setLoading] = useState(true);

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
            
            // Randomly select 5 cards from the available cards
            const shuffled = [...allCards].sort(() => 0.5 - Math.random());
            const selectedCards = shuffled.slice(0, 5).map((result: TCGPlayerCard) => ({
              productId: result.productId,
              productName: result.productName,
              marketPrice: result.marketPrice || result.lowestPrice || 0,
              lowestPrice: result.lowestPrice || 0,
              setName: result.setName || 'Unknown Set',
              rarityName: result.rarityName || 'Unknown',
              customAttributes: result.customAttributes || { cardType: [], energyType: [] }
            }));
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
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCards();
  }, []);



  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-bg">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-thunder mb-6">
              <span className="block">BUSCA Y COMPARA PRECIOS DE CARTAS</span>
            </h1>
            <p className="text-xl text-white/90 font-interphases mb-12 max-w-3xl mx-auto">
              Mejora tu experiencia de búsqueda con resultados unificados, conversión automática de monedas y listas de compra inteligentes.
            </p>
            {/* Hero Search */}
            <div className="mt-8">
              <SearchBox variant="hero" placeholder='Probá buscando "Pikachu Crown"' />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cards Section */}
      <section className="relative -mt-12 md:-mt-28">
        <div className="container-custom">
        
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden w-full overflow-x-scroll pb-4 hide-scrollbar">
            <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 animate-pulse"
                  >
                    <div className="w-48 h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg border-2 border-gray-200">
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-gray-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                featuredCards.map((card) => {
                  // Get card type from customAttributes
                  const cardType = card.customAttributes?.cardType?.[0] || 'Pokemon';
                  const energyType = card.customAttributes?.energyType?.[0] || '';
                  
                  return (
                    <div
                      key={card.productId}
                      className="flex-shrink-0"
                    >
                      <div className="relative group cursor-pointer">
                        <div className="w-48 h-64 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors duration-300">
                          {/* Card image with proper fallback */}
                          <div className="w-full h-full relative">
                            <img
                              src={`https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg`}
                              alt={card.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to Pokemon TCG card back
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.pokemontcg.io/250300/hires.png';
                              }}
                            />
                            
                            {/* Card information on hover overlay */}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="text-center text-white p-4">
                                <h3 className="text-lg font-bold mb-2">{card.productName}</h3>
                                <div className="space-y-1 text-sm">
                                  <p>{energyType || cardType}</p>
                                  <p>{card.rarityName}</p>
                                  <p>{card.setName}</p>
                                  <p className="text-yellow-400 font-semibold">${card.marketPrice.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Desktop: Stacked cards */}
          <div className="hidden md:flex relative justify-center items-center min-h-[400px]">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="absolute transform animate-pulse"
                  style={{
                    left: `${15 + index * 15}%`,
                    zIndex: index,
                  }}
                >
                  <div className="w-48 h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg border-2 border-gray-200">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              featuredCards.map((card, index) => {
              // Generate random rotation and translation values
              const rotation = index % 2 === 0 
                ? Math.random() * 15 - 7.5  // -7.5 to 7.5 degrees
                : Math.random() * -15 + 7.5; // -7.5 to 7.5 degrees
              
              const translateX = index % 2 === 0
                ? Math.random() * 20 - 10    // -10 to 10px
                : Math.random() * -20 + 10;  // -10 to 10px
              
              const translateY = Math.random() * 10 - 5; // -5 to 5px
              
                // Get card type from customAttributes
                const cardType = card.customAttributes?.cardType?.[0] || 'Pokemon';
                const energyType = card.customAttributes?.energyType?.[0] || '';
                
                return (
                  <div
                    key={card.productId}
                    className="absolute transform transition-all duration-300 hover:scale-110 hover:z-10"
                    style={{
                      transform: `rotate(${rotation}deg) translate(${translateX}px, ${translateY}px)`,
                      zIndex: index,
                      left: `${15 + index * 15}%`, // Distribute cards across the width
                    }}
                  >
                    <div className="relative group cursor-pointer">
                      <div className="w-48 h-64 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors duration-300">
                        {/* Card image with proper fallback */}
                        <div className="w-full h-full relative">
                          <img
                            src={`https://tcgplayer-cdn.tcgplayer.com/product/${card.productId}_in_400x400.jpg`}
                            alt={card.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to Pokemon TCG card back
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.pokemontcg.io/250300/hires.png';
                            }}
                          />
                          
                          {/* Card information on hover overlay */}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                              <h3 className="text-2xl font-bold mb-2">{card.productName}</h3>
                              <div className="space-y-1 text-sm">
                                <p>{energyType || cardType}</p>
                                <p>{card.rarityName}</p>
                                <p>{card.setName}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                );
            })
          )}
          </div>
          
          {/* Floating action button */}
          {/* <div className="text-center mt-16">
            <Link 
              href="/cards" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Ver Todas las Cartas
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div> */}
        </div>
      </section>

       {/* Reusable Cards Section - In Stock Cards */}
       {/* TODO: Replace cardIds with CSV inventory data (random 6 cards in stock) */}
       <ReusableCardsBlock 
        title="Cartas en stock"
        subtitle="Disponibles para entrega inmediata"
        cardIds={[478058, 250314, 250300, 250317, 250303, 250305]} // TODO: Fetch from CSV
        showRefreshButton={false}
        showFloatingButton={true}
        floatingButtonText="Ver Todas las Cartas en Stock"
        floatingButtonHref="/cards?inStock=true"
        className="py-16 bg-gradient-to-b from-white to-gray-50"
      />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Pokemon TCG Argentina?
            </h2>
            <p className="text-lg text-gray-600">
              La mejor experiencia para coleccionistas argentinos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card-hover p-6 text-center">
                <feature.icon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reusable Cards Section */}
      <ReusableCardsBlock 
        title="Cartas Más Vendidas"
        subtitle="Las cartas más populares de la semana"
        randomCount={6}
        showRefreshButton={true}
        showFloatingButton={true}
        floatingButtonText="Ver Todas las Cartas"
        floatingButtonHref="/cards"
        className="py-16 bg-gradient-to-b from-white to-gray-50"
      />

      {/* Call to Action Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Encuentra tu próxima carta favorita
          </h2>
          <p className="text-lg mb-8">
            Explora nuestra vasta colección y descubre ofertas increíbles.
          </p>
          <Link 
            href="/cards" 
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Explorar Cartas
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}