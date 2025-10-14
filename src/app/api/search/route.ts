import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAPIConfig } from '@/config/api-config';
import { searchLocalCards, hasLocalData } from '@/lib/local-pokemon-data';

// Simple in-memory cache for API responses (5 minute TTL)
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate cache key from query and filters
function getCacheKey(query: string, filters: any, provider: string): string {
  return `${provider}:${query}:${JSON.stringify(filters)}`;
}

// Check if cached response is still valid
function getCachedResponse(key: string): any | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    responseCache.delete(key); // Remove expired cache
  }
  return null;
}

// Store response in cache
function setCachedResponse(key: string, data: any): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

// Pokemon TCG API implementation with dual API key fallback
async function searchPokemonTCG(query: string, filters: any = {}) {
  const params = new URLSearchParams();
  params.set('q', `name:${query}*`);
  params.set('pageSize', '20');
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters.set) params.set('set.id', filters.set);
  if (filters.types && filters.types.length > 0) {
    params.set('types', filters.types.join(','));
  }
  if (filters.rarity) params.set('rarity', filters.rarity);
  if (filters.orderBy) params.set('orderBy', filters.orderBy);

  const url = `https://api.pokemontcg.io/v2/cards?${params.toString()}`;
  
  // Try both API keys in order
  const apiKeys = [
    process.env.POKEMON_TCG_API_KEY,
    process.env.NEXT_PUBLIC_POKEMON_API_KEY
  ].filter(Boolean);

  let lastError: Error | null = null;

  for (const apiKey of apiKeys) {
    try {
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (apiKey) {
        headers['X-Api-Key'] = apiKey;
      }
      
      // Add timeout to prevent hanging requests (reduced to 3s since API seems unreachable)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(url, {
        headers,
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 429) {
        // Rate limited with this API key, try the next one
        console.log(`API key rate limited, trying next key...`);
        continue;
      } else {
        throw new Error(`Pokemon TCG API error: ${response.status}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.log(`API key failed, trying next key...`);
      continue;
    }
  }

  // If all API keys failed, throw the last error
  throw lastError || new Error('All Pokemon TCG API keys failed');
}

// Transform Pokemon TCG API response to our unified format
function transformPokemonTCGResponse(data: any) {
  const transformedItems = data.data?.map((card: any) => ({
    id: card.id,
    name: card.name,
    detailUrl: card.tcgplayer?.url || `https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/${card.id}`,
    imageUrl: card.images?.large || card.images?.small || '/placeholder-card.svg',
    categoryName: card.set?.name || 'Unknown Set',
    offers: card.tcgplayer?.prices?.normal?.market ? [`$${card.tcgplayer.prices.normal.market}`] : ['Price N/A'],
    provider: 'Pokemon TCG API',
    rarity: card.rarity,
    setId: card.set?.id,
    cardId: card.id,
    types: card.types || [],
    weaknesses: card.weaknesses || [],
    resistances: card.resistances || [],
    attacks: card.attacks || [],
    hp: card.hp,
    nationalPokedexNumbers: card.nationalPokedexNumbers || []
  })) || [];

  return {
    items: transformedItems,
    total: transformedItems.length,
    page: data.page || 1,
    pageSize: data.pageSize || 20,
    count: data.count || transformedItems.length,
    totalCount: data.totalCount || transformedItems.length,
    providers: ['pokemon-tcg-api', 'tcgplayer'],
    games: [{ id: "pokemon", name: "Pokémon" }]
  };
}

// Updated Pokemon TCG search function that PRIORITIZES local data, then uses API as fallback
async function searchPokemonTCGWithFallback(query: string, filters: any = {}) {
  // Try local data first (FAST!)
  if (hasLocalData()) {
    try {
      console.log('Using local data for query:', query);
      const localData = await searchLocalCards(query, filters);
      return transformPokemonTCGResponse(localData);
    } catch (error) {
      console.log('Local data search failed, falling back to API:', error);
    }
  }
  
  // Fallback to API with dual key support (SLOW - network issues)
  try {
    const data = await searchPokemonTCG(query, filters);
    return transformPokemonTCGResponse(data);
  } catch (error) {
    console.error('API search also failed:', error);
    throw error;
  }
}

// PreciosTCG API implementation
async function searchPreciosTCG(query: string, filters: any = {}) {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('provider', 'tcgplayer');
  params.set('game', 'pokemon');
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());

  const possibleUrls = [
    `https://www.preciostcg.com/api/search?${params.toString()}`,
    `https://www.preciostcg.com/search?${params.toString()}`,
    `https://www.preciostcg.com/api/cards/search?q=${encodeURIComponent(query)}&provider=tcgplayer&game=pokemon`
  ];

  let response: Response | null = null;
  let lastError: Error | null = null;

  // Try each URL until one works
  for (const url of possibleUrls) {
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.preciostcg.com/',
          'Origin': 'https://www.preciostcg.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        break; // Success, use this response
      } else if (response.status === 429) {
        // Rate limited, try next URL or use fallback
        lastError = new Error(`Rate limited on ${url}`);
        continue;
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  // If no URL worked or we got rate limited, use fallback
  if (!response || !response.ok || response.status === 429) {
    console.log('PreciosTCG API rate limited or unavailable, using fallback data');
    return getFallbackData(query);
  }

  const data = await response.json();
  return data;
}

// Fallback data for when both APIs fail
function getFallbackData(query: string) {
  return {
    items: [
      {
        id: `fallback-${query}-1`,
        name: `${query} - Base Set (Shadowless)`,
        detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
        imageUrl: "/placeholder-card.svg",
        categoryName: "Base Set",
        offers: ["$15.99", "$12.50", "$18.25"],
        provider: "Fallback Data",
        rarity: "Rare Holo",
        setId: "base1",
        cardId: `fallback-${query}-1`,
        types: ["Water"],
        weaknesses: [],
        resistances: [],
        attacks: [],
        hp: 40,
        nationalPokedexNumbers: [7]
      },
      {
        id: `fallback-${query}-2`,
        name: `${query} - Evolutions (Holo)`,
        detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
        imageUrl: "/placeholder-card.svg",
        categoryName: "Evolutions",
        offers: ["$8.25", "$6.99", "$9.50"],
        provider: "Fallback Data",
        rarity: "Uncommon",
        setId: "evo",
        cardId: `fallback-${query}-2`,
        types: ["Water"],
        weaknesses: [],
        resistances: [],
        attacks: [],
        hp: 60,
        nationalPokedexNumbers: [7]
      },
      {
        id: `fallback-${query}-3`,
        name: `${query} - Modern Set (VMAX)`,
        detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
        imageUrl: "/placeholder-card.svg",
        categoryName: "Modern Set",
        offers: ["$4.50", "$3.99", "$5.25"],
        provider: "Fallback Data",
        rarity: "Rare Ultra",
        setId: "sm1",
        cardId: `fallback-${query}-3`,
        types: ["Water"],
        weaknesses: [],
        resistances: [],
        attacks: [],
        hp: 200,
        nationalPokedexNumbers: [7]
      }
    ],
    total: 3,
    page: 1,
    pageSize: 20,
    count: 3,
    totalCount: 3,
    providers: ["fallback", "tcgplayer"],
    games: [{ id: "pokemon", name: "Pokémon" }]
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const apiProvider = searchParams.get('provider') as 'pokemon-tcg' | 'precios-tcg' | 'auto' | null;
    
    // Get filters from query params
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      orderBy: searchParams.get('orderBy') || 'name',
      set: searchParams.get('set') || '',
      types: searchParams.get('types')?.split(',').filter(Boolean) || [],
      rarity: searchParams.get('rarity') || '',
    };

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const config = getCurrentAPIConfig();
    const provider = apiProvider || config.provider;

    // Check cache first
    const cacheKey = getCacheKey(query, filters, provider);
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('Returning cached result for:', query);
      return NextResponse.json(cachedResult);
    }

    let result: any = null;
    let lastError: Error | null = null;

    if (provider === 'pokemon-tcg') {
      try {
        result = await searchPokemonTCGWithFallback(query, filters);
      } catch (error) {
        lastError = error as Error;
        if (config.fallbackEnabled) {
          console.log('Pokemon TCG API failed with all keys, using fallback data');
          result = getFallbackData(query);
        }
      }
    } else if (provider === 'precios-tcg') {
      try {
        result = await searchPreciosTCG(query, filters);
      } catch (error) {
        lastError = error as Error;
        if (config.fallbackEnabled) {
          console.log('PreciosTCG API failed, using fallback data');
          result = getFallbackData(query);
        }
      }
    } else if (provider === 'auto') {
      // Try both APIs and use the best result
      let pokemonResult: any = null;
      let preciosResult: any = null;
      
      try {
        pokemonResult = await searchPokemonTCGWithFallback(query, filters);
      } catch (error) {
        console.log('Pokemon TCG API failed with all keys:', error);
      }
      
      try {
        preciosResult = await searchPreciosTCG(query, filters);
      } catch (error) {
        console.log('PreciosTCG API failed:', error);
      }

      // Choose the best result
      if (pokemonResult && preciosResult) {
        // If both work, prefer the one with more results or better data
        result = pokemonResult.items.length >= preciosResult.items.length ? pokemonResult : preciosResult;
      } else if (pokemonResult) {
        result = pokemonResult;
      } else if (preciosResult) {
        result = preciosResult;
      } else if (config.fallbackEnabled) {
        console.log('Both APIs failed, using fallback data');
        result = getFallbackData(query);
      }
    }

    if (!result) {
      throw lastError || new Error('No API provider available');
    }

    // Cache the successful result
    setCachedResponse(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in unified search API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
