/**
 * TCGPlayer Scraper
 * 
 * Scrapes TCGPlayer.com search results to get real Pokemon card data and prices.
 * Based on the approach used by preciostcg.com
 * 
 * Strategy:
 * 1. Use TCGPlayer's internal API (found via browser network inspection)
 * 2. Scrape search results HTML as fallback
 * 3. Extract card data and pricing information
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TCGPlayerCard {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity?: string;
  imageUrl: string;
  productUrl: string;
  prices: {
    market?: number;
    low?: number;
    mid?: number;
    high?: number;
  };
  inStock: boolean;
}

export interface TCGPlayerSearchResult {
  cards: TCGPlayerCard[];
  totalResults: number;
  hasMore: boolean;
}

/**
 * TCGPlayer's internal API endpoint (discovered via network inspection)
 * They use this for their autocomplete and search features
 */
const TCGPLAYER_API_BASE = 'https://mp-search-api.tcgplayer.com';
const TCGPLAYER_SEARCH_BASE = 'https://www.tcgplayer.com/search/pokemon/product';

/**
 * Search TCGPlayer using their internal API
 * This is the same endpoint their frontend uses
 */
export async function searchTCGPlayerAPI(query: string, options: {
  page?: number;
  limit?: number;
  setName?: string;
} = {}): Promise<TCGPlayerSearchResult> {
  try {
    const { page = 1, limit = 25, setName } = options;
    
    // Build search query
    let searchQuery = query;
    if (setName) {
      searchQuery = `${query} ${setName}`;
    }

    // TCGPlayer's search API endpoint
    // Note: This might require authentication or tokens - will need to inspect browser requests
    const url = `${TCGPLAYER_API_BASE}/v1/search/request`;
    
    const payload = {
      algorithm: "sales_synonym_v1",
      from: (page - 1) * limit,
      size: limit,
      filters: {
        term: {
          productLineName: ["Pokemon"]
        }
      },
      listingSearch: {
        context: {
          cart: {}
        },
        filters: {
          term: {
            sellerStatus: "Live",
            channelId: 0
          }
        }
      },
      context: {
        cart: {},
        shippingCountry: "US"
      },
      settings: {
        useFuzzySearch: true
      },
      sort: {
        field: "Relevance",
        order: "desc"
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 15000
    });

    // Parse response and extract card data
    const cards: TCGPlayerCard[] = response.data.results?.map((result: any) => ({
      id: result.productId || `tcg-${result.productId}`,
      name: result.productName || result.name,
      setName: result.setName || 'Unknown Set',
      cardNumber: result.number || '',
      rarity: result.rarity,
      imageUrl: result.imageUrl || result.image || '/placeholder-card.svg',
      productUrl: `https://www.tcgplayer.com/product/${result.productId}`,
      prices: {
        market: result.marketPrice,
        low: result.lowPrice,
        mid: result.midPrice,
        high: result.highPrice,
      },
      inStock: result.inStock !== false
    })) || [];

    return {
      cards,
      totalResults: response.data.totalResults || cards.length,
      hasMore: response.data.totalResults > (page * limit)
    };
    
  } catch (error) {
    console.error('TCGPlayer API search failed:', error);
    // Fallback to HTML scraping
    return searchTCGPlayerHTML(query, options);
  }
}

/**
 * Fallback: Scrape TCGPlayer search results HTML
 * Used when the API doesn't work or requires authentication
 */
export async function searchTCGPlayerHTML(query: string, options: {
  page?: number;
  limit?: number;
  setName?: string;
} = {}): Promise<TCGPlayerSearchResult> {
  try {
    const { page = 1, setName } = options;
    
    // Build search URL
    let searchQuery = query;
    if (setName) {
      searchQuery = `${query} ${setName}`;
    }
    
    const url = `${TCGPLAYER_SEARCH_BASE}?q=${encodeURIComponent(searchQuery)}&page=${page}`;
    
    console.log(`Scraping TCGPlayer: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tcgplayer.com/',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const cards: TCGPlayerCard[] = [];

    // TCGPlayer's search results are typically in a specific structure
    // This will need to be adjusted based on their actual HTML structure
    $('.search-result, .product-card, [data-testid="product-card"]').each((i, element) => {
      const $el = $(element);
      
      const name = $el.find('.product-card__title, .product-name, h3').first().text().trim();
      const setName = $el.find('.product-card__set, .set-name, .product-set').first().text().trim();
      const priceText = $el.find('.product-card__price, .price, [data-testid="price"]').first().text().trim();
      const imageUrl = $el.find('img').first().attr('src') || '/placeholder-card.svg';
      const productUrl = $el.find('a').first().attr('href') || '';
      
      if (name) {
        // Extract price (format: $XX.XX)
        const priceMatch = priceText.match(/\$?([\d.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
        
        // Extract product ID from URL
        const idMatch = productUrl.match(/product\/(\d+)/);
        const productId = idMatch ? idMatch[1] : `tcg-${i}`;
        
        cards.push({
          id: productId,
          name,
          setName: setName || 'Unknown Set',
          cardNumber: '',
          imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
          productUrl: productUrl.startsWith('http') ? productUrl : `https://www.tcgplayer.com${productUrl}`,
          prices: {
            market: price,
          },
          inStock: true
        });
      }
    });

    return {
      cards,
      totalResults: cards.length,
      hasMore: false
    };
    
  } catch (error) {
    console.error('TCGPlayer HTML scraping failed:', error);
    throw new Error('Failed to scrape TCGPlayer');
  }
}

/**
 * Get card details from TCGPlayer product page
 */
export async function getTCGPlayerCardDetails(productId: string): Promise<TCGPlayerCard | null> {
  try {
    const url = `https://www.tcgplayer.com/product/${productId}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract card details from product page
    const name = $('h1.product-details__name, h1').first().text().trim();
    const setName = $('.product-details__set, .breadcrumbs').text().trim();
    const marketPrice = $('.price-point--market .price-point__data').text().trim();
    
    // Extract all available prices
    const prices: any = {};
    $('.price-points .price-point').each((i, el) => {
      const $el = $(el);
      const label = $el.find('.price-point__label').text().trim().toLowerCase();
      const value = $el.find('.price-point__data').text().trim().replace(/\$/g, '');
      
      if (label.includes('market')) prices.market = parseFloat(value);
      if (label.includes('low')) prices.low = parseFloat(value);
      if (label.includes('mid')) prices.mid = parseFloat(value);
      if (label.includes('high')) prices.high = parseFloat(value);
    });

    return {
      id: productId,
      name,
      setName,
      cardNumber: '',
      imageUrl: $('img.product-image').attr('src') || '/placeholder-card.svg',
      productUrl: url,
      prices,
      inStock: true
    };
    
  } catch (error) {
    console.error(`Failed to get TCGPlayer card details for ${productId}:`, error);
    return null;
  }
}

