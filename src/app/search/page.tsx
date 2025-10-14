'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface PreciosCard {
  name: string;
  detailUrl: string;
  imageUrl: string;
  categoryName: string;
  offers: string[];
  outOfStockPrice?: string;
  provider: string;
}

interface SearchResponse {
  items: PreciosCard[];
  total: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<PreciosCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('tcgplayer');
  const [game, setGame] = useState('pokemon');
  const [error, setError] = useState('');

  // Get initial query from URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('query') || '';
      if (query) {
        setSearchQuery(query);
        performSearch(query);
      }
    }
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Use unified search API
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&provider=precios-tcg`
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data: SearchResponse = await response.json();
      setCards(data.items || []);
    } catch (err) {
      setError('Error al buscar cartas. Intenta nuevamente.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL without reload
      if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}?query=${encodeURIComponent(searchQuery)}`;
        window.history.pushState({}, '', newUrl);
      }
      performSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cartas Pokemon..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="tcgplayer">TCGPlayer</option>
                  <option value="trollandtoad">Troll and Toad</option>
                  <option value="pricecharting">PriceCharting</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 flex items-center gap-2"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Resultados para "{searchQuery}"
            </h2>
            <p className="text-gray-600 mt-1">
              {loading ? 'Buscando...' : `${cards.length} cartas encontradas`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {cards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-[2.5/3.5] relative">
                  <Image
                    src={card.imageUrl || '/placeholder-card.svg'}
                    alt={card.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-card.svg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {card.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{card.categoryName}</p>
                  <div className="space-y-1">
                    {card.offers.slice(0, 3).map((offer, offerIndex) => (
                      <p key={offerIndex} className="text-sm font-medium text-primary-600">
                        {offer}
                      </p>
                    ))}
                    {card.outOfStockPrice && (
                      <p className="text-sm text-gray-500">
                        Agotado: {card.outOfStockPrice}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 uppercase">
                      {card.provider}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600">
              Intenta con otros términos de búsqueda o un proveedor diferente.
            </p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Busca tus cartas Pokemon favoritas
            </h3>
            <p className="text-gray-600">
              Encuentra los mejores precios en diferentes proveedores.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}