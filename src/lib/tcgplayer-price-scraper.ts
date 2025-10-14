/**
 * TCGPlayer Price Scraper
 * 
 * Scrapes TCGPlayer.com search results to get REAL pricing data
 * Based on preciostcg.com approach
 * 
 * Usage: searchTCGPlayerPrices("Charizard") → returns cards with real prices
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TCGPlayerPrice {
  productId: string;
  productName: string;
  setName: string;
  marketPrice?: number;
  lowPrice?: number;
  midPrice?: number;
  highPrice?: number;
  url: string;
  imageUrl?: string;
  inStock: boolean;
}

/**
 * Search TCGPlayer and extract pricing data
 * This is what preciostcg.com does: fetch search page and scrape HTML
 */
export async function searchTCGPlayerPrices(query: string): Promise<TCGPlayerPrice[]> {
  try {
    const url = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(query)}`;
    
    console.log(`[TCGPlayer] Fetching prices for: ${query}`);
    console.log(`[TCGPlayer] URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.tcgplayer.com/',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    console.log(`[TCGPlayer] Response status: ${response.status}`);
    
    const $ = cheerio.load(response.data);
    const cards: TCGPlayerPrice[] = [];

    // TCGPlayer uses specific CSS selectors for their product listings
    // We need to find the actual selectors they use
    
    // Try multiple possible selectors (TCGPlayer changes their HTML structure)
    const selectors = [
      '.search-result',
      '.product-card',
      '[data-testid="product-card"]',
      '.search-result-item',
      '.product-listing',
      'article',
    ];

    let foundElements = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`[TCGPlayer] Found ${elements.length} products using selector: ${selector}`);
        foundElements = true;
        
        elements.each((i, element) => {
          const $el = $(element);
          
          // Extract card information
          const name = $el.find('h3, .product-name, [class*="product"][class*="title"], [class*="card"][class*="name"]')
            .first()
            .text()
            .trim();
          
          const setName = $el.find('.set-name, [class*="set"], [class*="edition"]')
            .first()
            .text()
            .trim();
          
          // Extract price - look for price elements
          const priceText = $el.find('.price, [class*="price"], [data-testid*="price"]')
            .first()
            .text()
            .trim();
          
          // Extract image
          const imageUrl = $el.find('img').first().attr('src') || 
                          $el.find('img').first().attr('data-src') || 
                          '';
          
          // Extract product URL
          const productUrl = $el.find('a').first().attr('href') || '';
          
          // Extract product ID from URL
          const productId = extractProductId(productUrl) || `tcg-${i}`;
          
          // Parse price
          const price = parsePrice(priceText);
          
          if (name) {
            cards.push({
              productId,
              productName: name,
              setName: setName || 'Unknown Set',
              marketPrice: price,
              url: productUrl.startsWith('http') ? productUrl : `https://www.tcgplayer.com${productUrl}`,
              imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
              inStock: true,
            });
          }
        });
        
        break; // Found products, stop trying other selectors
      }
    }

    if (!foundElements) {
      console.log('[TCGPlayer] No products found with known selectors');
      console.log('[TCGPlayer] Page HTML preview:', response.data.substring(0, 500));
      
      // Fallback: try to find ANY element with product data
      // Look for script tags that might contain JSON data
      $('script[type="application/json"], script[type="application/ld+json"]').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('price') && content.includes('name')) {
          try {
            const data = JSON.parse(content);
            console.log('[TCGPlayer] Found JSON data in script tag');
            // Process JSON data if it contains product info
          } catch (e) {
            // Not valid JSON or not useful
          }
        }
      });
    }

    console.log(`[TCGPlayer] Extracted ${cards.length} cards`);
    return cards;
    
  } catch (error: any) {
    console.error('[TCGPlayer] Scraping error:', error.message);
    if (error.response) {
      console.error('[TCGPlayer] Response status:', error.response.status);
      console.error('[TCGPlayer] Response headers:', error.response.headers);
    }
    throw new Error(`TCGPlayer scraping failed: ${error.message}`);
  }
}

/**
 * Extract product ID from TCGPlayer URL
 * URL format: /product/12345/... or /product/12345
 */
function extractProductId(url: string): string | null {
  if (!url) return null;
  
  const match = url.match(/\/product\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse price string to number
 * Handles formats: "$12.99", "12.99", "$1,234.56"
 */
function parsePrice(priceText: string): number | undefined {
  if (!priceText) return undefined;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceText.replace(/[$,\s]/g, '');
  
  // Extract first number
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    return isNaN(price) ? undefined : price;
  }
  
  return undefined;
}

/**
 * Get detailed pricing for a specific card by product ID
 */
export async function getTCGPlayerCardPricing(productId: string): Promise<TCGPlayerPrice | null> {
  try {
    const url = `https://www.tcgplayer.com/product/${productId}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    
    // Extract pricing information from product page
    const name = $('h1').first().text().trim();
    const setName = $('.breadcrumbs, .product-details__set').text().trim();
    
    // Look for price points
    const prices: any = {};
    
    // Market price
    const marketPriceText = $('.price-point--market .price-point__data, [data-testid="market-price"]')
      .first()
      .text()
      .trim();
    prices.marketPrice = parsePrice(marketPriceText);
    
    // Other prices
    $('.price-point').each((i, el) => {
      const $el = $(el);
      const label = $el.find('.price-point__label').text().toLowerCase();
      const valueText = $el.find('.price-point__data').text();
      const value = parsePrice(valueText);
      
      if (label.includes('low')) prices.lowPrice = value;
      if (label.includes('mid')) prices.midPrice = value;
      if (label.includes('high')) prices.highPrice = value;
      if (label.includes('market') && !prices.marketPrice) prices.marketPrice = value;
    });
    
    const imageUrl = $('img.product-image, [class*="product"][class*="image"]').first().attr('src') || '';

    return {
      productId,
      productName: name,
      setName,
      ...prices,
      url,
      imageUrl,
      inStock: true,
    };
    
  } catch (error: any) {
    console.error(`[TCGPlayer] Failed to get pricing for product ${productId}:`, error.message);
    return null;
  }
}

/**
 * Batch search for multiple cards
 */
export async function searchMultipleTCGPlayerPrices(queries: string[]): Promise<Map<string, TCGPlayerPrice[]>> {
  const results = new Map<string, TCGPlayerPrice[]>();
  
  for (const query of queries) {
    try {
      const prices = await searchTCGPlayerPrices(query);
      results.set(query, prices);
      
      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[TCGPlayer] Failed to search for ${query}:`, error);
      results.set(query, []);
    }
  }
  
  return results;
}

