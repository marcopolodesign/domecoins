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
  aggregations?: any;
}

/**
 * Search TCGPlayer using their REAL internal API
 * Discovered via browser network inspection
 * 
 * WORKING IMPLEMENTATION - Tested and verified!
 */
export async function searchTCGPlayerPrices(
  query: string,
  options: {
    limit?: number;
    from?: number;
  } = {}
): Promise<TCGPlayerPrice[]> {
  try {
    const { limit = 24, from = 0 } = options;
    
    // TCGPlayer's actual internal API endpoint
    const url = 'https://mp-search-api.tcgplayer.com/v1/search/request';
    
    // Query parameters
    const params = {
      q: query,
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
    
    console.log(`[TCGPlayer] Searching for: "${query}"`);
    
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
      return [];
    }
    
    // Extract cards from the first result set
    const firstResult = data.results[0];
    const products = firstResult.results || [];
    
    console.log(`[TCGPlayer] Found ${products.length}/${firstResult.totalResults} products`);
    
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
    
    console.log(`[TCGPlayer] Successfully extracted ${cards.length} cards with prices`);
    
    return cards;
    
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
      const prices = await searchTCGPlayerPrices(query);
      results.set(query, prices);
      
      // Delay between requests to avoid rate limiting (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch (error) {
      console.error(`[TCGPlayer] Failed to search for ${query}:`, error);
      results.set(query, []);
    }
  }
  
  return results;
}
