/**
 * TCGPlayer Price Scraper
 * 
 * Uses TCGPlayer's internal search API to get REAL pricing data
 * Based on preciostcg.com approach and browser network inspection
 * 
 * API Endpoint: https://mp-search-api.tcgplayer.com/v1/search/request
 * Method: GET with query parameters
 * 
 * Example: https://mp-search-api.tcgplayer.com/v1/search/request?q=Flying+Pikachu+VMAX+celebrations&isList=false&mpfev=4345
 * 
 * Usage: searchTCGPlayerPrices("Charizard") → returns cards with real prices
 */

import axios from 'axios';

export interface TCGPlayerPrice {
  productId: number;
  productName: string;
  setName: string;
  setId: number;
  marketPrice?: number;
  lowestPrice?: number;
  lowestPriceWithShipping?: number;
  medianPrice?: number;
  url: string;
  imageUrl: string;
  inStock: boolean;
  totalListings: number;
  rarity?: string; // Extracted from rarityName or customAttributes.rarityDbName
  cardNumber?: string;
  hp?: string;
  attacks?: string[];
  energyType?: string[];
  customAttributes?: {
    rarityDbName?: string;
    number?: string;
    hp?: string;
    energyType?: string[];
    attack1?: string;
    attack2?: string;
    attack3?: string;
    attack4?: string;
    stage?: string;
    cardType?: string[];
    retreatCost?: string;
    resistance?: string;
    weakness?: string;
    flavorText?: string;
  };
}

export interface TCGPlayerSearchResult {
  cards: TCGPlayerPrice[];
  totalResults: number;
  totalAvailable?: number; // Total cards available for this search
  aggregations?: any;
}

/**
 * Search TCGPlayer using their REAL internal API
 * Discovered via browser network inspection
 * 
 * WORKING IMPLEMENTATION - Tested and verified!
 * 
 * IMPORTANT LIMITS (tested 2024):
 * - Maximum pageSize: 50 cards per request
 * - Requests with pageSize > 50 return 400 Bad Request
 * - Average response time: ~1000ms for 20-50 cards
 * 
 * @param query - Search query string
 * @param options - Pagination options
 * @param options.pageSize - Number of results per page (default: 24, max: 50)
 * @param options.page - Page number (1-indexed)
 * @param options.limit - Alternative to pageSize (for backwards compatibility)
 * @param options.from - Alternative to page (0-indexed offset)
 */
/**
 * Parse search query to extract rarity filters
 * TCGPlayer's API doesn't handle rarity keywords in the query well,
 * so we extract them and filter results client-side
 */
function parseQueryForRarity(query: string): { cleanQuery: string; rarityFilter: string | null } {
  // Sort keywords by length (longest first) to match multi-word rarities first
  const rarityKeywords = [
    'ultra rare', 'secret rare', 'rainbow rare', 'reverse holo',
    'full art', 'alternate art', 'alt art',
    'holo', 'holofoil', 'holographic',
    'reverse', 
    'promo', 'promotional',
    'rare',
    'common', 'uncommon'
  ];
  
  let cleanQuery = query.toLowerCase();
  let rarityFilter: string | null = null;
  
  // Check for rarity keywords (longest first to avoid partial matches)
  for (const keyword of rarityKeywords) {
    if (cleanQuery.includes(keyword)) {
      rarityFilter = keyword;
      // Remove the keyword from the query
      cleanQuery = cleanQuery.replace(keyword, '').trim();
      // Remove extra spaces
      cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();
      break;
    }
  }
  
  return { cleanQuery: cleanQuery || query, rarityFilter };
}

export async function searchTCGPlayerPrices(
  query: string,
  options: {
    pageSize?: number;
    page?: number;
    limit?: number;
    from?: number;
  } = {}
): Promise<{ cards: TCGPlayerPrice[]; totalResults: number }> {
  try {
    // Parse query for rarity filters first
    const { cleanQuery, rarityFilter } = parseQueryForRarity(query);
    const searchQuery = cleanQuery;
    
    if (rarityFilter) {
      console.log(`[TCGPlayer] Extracted rarity filter "${rarityFilter}" from query "${query}"`);
      console.log(`[TCGPlayer] Clean search query: "${searchQuery}"`);
    }
    
    // Support both pageSize/page and limit/from for flexibility
    // Enforce TCGPlayer's maximum limit of 50 cards per request
    const requestedPageSize = options.pageSize || options.limit || 24;
    
    // If we have a rarity filter, fetch more results (max 50) to have enough to filter
    const fetchSize = rarityFilter ? 50 : Math.min(requestedPageSize, 50);
    const pageSize = fetchSize;
    const page = options.page || 1;
    const from = options.from !== undefined ? options.from : (page - 1) * pageSize;
    const limit = pageSize;
    
    if (requestedPageSize > 50) {
      console.warn(`[TCGPlayer] Requested pageSize ${requestedPageSize} exceeds limit. Using maximum of 50.`);
    }
    
    // TCGPlayer's actual internal API endpoint
    const url = 'https://mp-search-api.tcgplayer.com/v1/search/request';
    
    // Query parameters (use cleaned query without rarity keywords)
    const params = {
      q: searchQuery,
      isList: 'false',
      mpfev: '4345',
    };
    
    // POST payload (required for results to be returned)
    const payload = {
      algorithm: 'salesrel',
      from,
      size: limit,
      filters: {
        term: {
          productLineName: ['Pokemon']
        }
      },
      listingSearch: {
        context: {
          cart: {}
        }
      },
      context: {
        cart: {}
      },
      sort: {}
    };
    
    console.log(`[TCGPlayer] Searching for: "${searchQuery}"${rarityFilter ? ` (with rarity filter: ${rarityFilter})` : ''}`);
    
    const response = await axios.post(url, payload, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.tcgplayer.com/',
        'Origin': 'https://www.tcgplayer.com',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
    });

    console.log(`[TCGPlayer] Response status: ${response.status}`);
    
    // Parse the API response
    const data = response.data;
    
    if (!data.results || data.results.length === 0) {
      console.log('[TCGPlayer] No results in response');
      return { cards: [], totalResults: 0 };
    }
    
    // Extract cards from the first result set
    const firstResult = data.results[0];
    const products = firstResult.results || [];
    const totalResults = firstResult.totalResults || 0;
    
    console.log(`[TCGPlayer] Found ${products.length}/${totalResults} products (page ${page}, size ${pageSize})`);
    
    // Log full structure of first product for debugging
    if (products.length > 0) {
      console.log('[TCGPlayer] FULL FIRST PRODUCT STRUCTURE:', JSON.stringify(products[0], null, 2));
    }
    
    // Transform API response to our format
    const cards: TCGPlayerPrice[] = products.map((product: any) => {
      // Extract attacks from customAttributes
      const attacks: string[] = [];
      if (product.customAttributes) {
        ['attack1', 'attack2', 'attack3', 'attack4'].forEach(key => {
          if (product.customAttributes[key]) {
            attacks.push(product.customAttributes[key]);
          }
        });
      }
      
      // Extract rarity - prioritize rarityName from the product, fallback to customAttributes
      const rarity = product.rarityName || 
                     product.customAttributes?.rarityDbName || 
                     product.rarity || 
                     undefined;
      
      // Debug log for first product to check structure
      if (products.indexOf(product) === 0) {
        console.log('[TCGPlayer] First product rarity extraction:', {
          productName: product.productName,
          rarityName: product.rarityName,
          rarityDbName: product.customAttributes?.rarityDbName,
          extractedRarity: rarity,
          SUCCESS: !!rarity
        });
      }
      
      return {
        productId: product.productId,
        productName: product.productName,
        setName: product.setName,
        setId: product.setId,
        marketPrice: product.marketPrice,
        lowestPrice: product.lowestPrice,
        lowestPriceWithShipping: product.lowestPriceWithShipping,
        medianPrice: product.medianPrice,
        url: `https://www.tcgplayer.com/product/${product.productId}/${encodeURIComponent(product.productUrlName || product.productName)}`,
        imageUrl: `https://product-images.tcgplayer.com/fit-in/437x437/${product.productId}.jpg`,
        inStock: (product.totalListings || 0) > 0,
        totalListings: product.totalListings || 0,
        rarity,
        cardNumber: product.customAttributes?.number,
        hp: product.customAttributes?.hp,
        attacks,
        energyType: product.customAttributes?.energyType,
        customAttributes: product.customAttributes, // Include full customAttributes for additional data
      };
    });
    
    // Apply rarity filter if one was extracted from the query
    let filteredCards = cards;
    let filteredTotal = totalResults;
    
    if (rarityFilter) {
      filteredCards = cards.filter(card => {
        if (!card.rarity) return false;
        
        const cardRarity = card.rarity.toLowerCase();
        
        // Match rarity keywords
        if (rarityFilter === 'holo' || rarityFilter === 'holofoil' || rarityFilter === 'holographic') {
          return cardRarity.includes('holo');
        }
        if (rarityFilter === 'reverse' || rarityFilter === 'reverse holo') {
          return cardRarity.includes('reverse');
        }
        if (rarityFilter === 'ultra rare') {
          return cardRarity.includes('ultra rare') || cardRarity.includes('ultra-rare') || cardRarity === 'ultra rare';
        }
        if (rarityFilter === 'secret rare') {
          return cardRarity.includes('secret rare') || cardRarity.includes('secret-rare');
        }
        if (rarityFilter === 'rainbow rare') {
          return cardRarity.includes('rainbow rare') || cardRarity.includes('rainbow-rare');
        }
        if (rarityFilter === 'full art' || rarityFilter === 'alt art' || rarityFilter === 'alternate art') {
          return cardRarity.includes('full art') || cardRarity.includes('alternate art');
        }
        if (rarityFilter === 'promo' || rarityFilter === 'promotional') {
          return cardRarity.includes('promo');
        }
        if (rarityFilter === 'rare') {
          return cardRarity.includes('rare');
        }
        if (rarityFilter === 'common') {
          return cardRarity === 'common';
        }
        if (rarityFilter === 'uncommon') {
          return cardRarity === 'uncommon';
        }
        
        return false;
      });
      
      // Estimate total filtered results (since we only fetched one page)
      // This is an approximation based on the filter rate
      const filterRate = filteredCards.length / cards.length;
      filteredTotal = Math.ceil(totalResults * filterRate);
      
      console.log(`[TCGPlayer] Filtered from ${cards.length} to ${filteredCards.length} cards based on rarity: ${rarityFilter}`);
      console.log(`[TCGPlayer] Estimated total filtered results: ${filteredTotal} (${(filterRate * 100).toFixed(1)}% match rate)`);
      
      // Trim to requested page size if we fetched more for filtering
      filteredCards = filteredCards.slice(0, requestedPageSize);
    }
    
    console.log(`[TCGPlayer] Successfully extracted ${filteredCards.length} cards with prices`);
    console.log(`[TCGPlayer] Total available results: ${filteredTotal}`);
    
    return {
      cards: filteredCards,
      totalResults: filteredTotal
    };
    
  } catch (error: any) {
    console.error('[TCGPlayer] API error:', error.message);
    if (error.response) {
      console.error('[TCGPlayer] Response status:', error.response.status);
      console.error('[TCGPlayer] Response data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    throw new Error(`TCGPlayer API failed: ${error.message}`);
  }
}


/**
 * Batch search for multiple cards with rate limiting
 */
export async function searchMultipleTCGPlayerPrices(queries: string[]): Promise<Map<string, TCGPlayerPrice[]>> {
  const results = new Map<string, TCGPlayerPrice[]>();
  
  for (const query of queries) {
    try {
      const response = await searchTCGPlayerPrices(query);
      results.set(query, response.cards);
      
      // Delay between requests to avoid rate limiting (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch (error) {
      console.error(`[TCGPlayer] Failed to search for ${query}:`, error);
      results.set(query, []);
    }
  }
  
  return results;
}
