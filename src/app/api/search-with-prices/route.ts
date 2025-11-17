import { NextRequest, NextResponse } from 'next/server';
import { searchTCGPlayerPrices, fetchProductDetails } from '@/lib/tcgplayer-price-scraper';
import { getInventory, getBlacklistCards } from '@/lib/kv';
import { calculateFinalPrice } from '@/utils/priceFormulas';

/**
 * Search API with TCGPlayer Prices
 * 
 * Uses TCGPlayer's API directly for real-time card data and pricing
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, pageSize = 50 } = body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      );
    }
    
    console.log(`[SearchWithPrices POST] Fetching ${productIds.length} specific products for in-stock view`);
    console.log(`[SearchWithPrices POST] Product IDs:`, productIds.slice(0, 10), '...');
    
    // Get blacklist
    let blacklist: string[] = [];
    try {
      blacklist = await getBlacklistCards();
      console.log(`[SearchWithPrices POST] Fetched ${blacklist.length} blacklisted cards`);
    } catch (error) {
      console.error('[SearchWithPrices POST] Error fetching blacklist:', error);
    }

    // Fetch each product by ID
    const productPromises = productIds.map(id => fetchProductDetails(parseInt(id, 10)));
    const products = await Promise.all(productPromises);
    
    // Filter out null results and enrich with pricing
    const enrichedCards = products
      .filter(Boolean)
      .map(product => {
        const rarity = product!.rarity || 'Unknown';
        const marketPrice = product!.marketPrice || 0;
        const finalRetailPrice = calculateFinalPrice(rarity, marketPrice);
        
        return {
          id: `tcg-${product!.productId}`,
          productId: product!.productId,
          name: product!.productName,
          images: {
            small: product!.imageUrl,
            large: product!.imageUrl,
          },
          set: {
            name: product!.setName,
            id: product!.setId?.toString() || '',
          },
          number: product!.cardNumber || '',
          rarity: product!.rarity || 'Unknown',
          pricing: {
            marketPrice: product!.marketPrice,
            retailPrice: finalRetailPrice,
            lowPrice: product!.lowestPrice,
          },
          inStock: true, // These are explicitly in-stock cards
          hp: product!.hp || '',
          attacks: product!.attacks || [],
          types: product!.energyType || [],
          offers: [`$${finalRetailPrice.toFixed(2)}`],
        };
      });
    
    // Filter out blacklisted cards and "Code Card" rarity
    const filteredCards = enrichedCards.filter(card => {
      const productId = card.productId.toString();
      const isBlacklisted = blacklist.includes(productId);
      const isCodeCard = card.rarity && card.rarity.toLowerCase().includes('code card');
      
      if (isBlacklisted) {
        console.log(`[SearchWithPrices POST] Filtering blacklisted card: ${card.name} (${productId})`);
      }
      if (isCodeCard) {
        console.log(`[SearchWithPrices POST] Filtering code card: ${card.name}`);
      }
      
      return !isBlacklisted && !isCodeCard;
    });
    
    console.log(`[SearchWithPrices POST] Successfully loaded ${filteredCards.length} in-stock cards (filtered ${enrichedCards.length - filteredCards.length})`);
    
    // CRITICAL: Sort cards with IN STOCK ALWAYS FIRST, then by price
    const sortedCards = filteredCards.sort((a, b) => {
      // First priority: in-stock cards ALWAYS at top
      const aInStock = a.inStock || false;
      const bInStock = b.inStock || false;
      
      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      
      // Second priority: sort by price (lowest first)
      const aPrice = a.pricing?.retailPrice || a.pricing?.marketPrice || 0;
      const bPrice = b.pricing?.retailPrice || b.pricing?.marketPrice || 0;
      
      return aPrice - bPrice;
    });

    console.log(`[SearchWithPrices POST] Sorted ${sortedCards.length} cards (in-stock first, then by price)`);
    
    return NextResponse.json({
      results: sortedCards,
      totalResults: sortedCards.length,
      page: 1,
      pageSize: sortedCards.length,
    });
    
  } catch (error: any) {
    console.error('[SearchWithPrices POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Use default search if no query provided
    const searchQuery = query || 'pokemon';

    console.log(`[SearchWithPrices] Query: ${searchQuery}, pageSize: ${pageSize}, page: ${page}`);
    
    // CRITICAL: Fetch ALL results from TCGPlayer to enable proper in-stock sorting
    // First, make an initial request to get the total count
    const initialResponse = await searchTCGPlayerPrices(searchQuery, {
      pageSize: 300,
      page: 1,
    });
    
    const totalAvailable = initialResponse.totalResults;
    console.log(`[SearchWithPrices] Total available from TCGPlayer: ${totalAvailable}`);
    
    // Fetch ALL pages from TCGPlayer (up to a reasonable limit to avoid timeouts)
    const maxCardsToFetch = Math.min(totalAvailable, 1000); // Cap at 1000 to avoid timeouts
    const fetchPageSize = 300;
    const totalPagesToFetch = Math.ceil(maxCardsToFetch / fetchPageSize);
    
    console.log(`[SearchWithPrices] Fetching ${totalPagesToFetch} pages (${maxCardsToFetch} cards) from TCGPlayer`);
    
    // Fetch all pages in parallel
    const fetchPromises = [];
    for (let i = 1; i <= totalPagesToFetch; i++) {
      fetchPromises.push(
        searchTCGPlayerPrices(searchQuery, {
          pageSize: fetchPageSize,
          page: i,
        })
      );
    }
    
    const allResponses = await Promise.all(fetchPromises);
    const tcgResults = allResponses.flatMap(response => response.cards);
    
    console.log(`[SearchWithPrices] Got ${tcgResults.length} results from TCGPlayer (${totalAvailable} total available)`);

    // Get inventory for all product IDs (need to check all variants)
    let fullInventory: Record<string, number> = {};
    
    try {
      // Fetch ALL inventory from KV to check variants
      fullInventory = await getInventory();
      console.log('[SearchWithPrices] Fetched full inventory');
    } catch (error) {
      console.error('[SearchWithPrices] Error fetching inventory from KV:', error);
    }

    // Get blacklist
    let blacklist: string[] = [];
    try {
      blacklist = await getBlacklistCards();
      console.log(`[SearchWithPrices] Fetched ${blacklist.length} blacklisted cards`);
    } catch (error) {
      console.error('[SearchWithPrices] Error fetching blacklist:', error);
    }

    // Convert TCGPlayer results to our card format
    const enrichedCards = tcgResults.map((priceData, index) => {
      // Check if ANY variant of this product is in stock
      const productId = priceData.productId.toString();
      const productVariants = Object.keys(fullInventory).filter(key => 
        key.startsWith(`${productId}:`)
      );
      const totalStock = productVariants.reduce((sum, key) => sum + (fullInventory[key] || 0), 0);
      const inStock = totalStock > 0;
      
      // Calculate final retail price using formula
      const rarity = priceData.rarity || 'Unknown';
      const marketPrice = priceData.marketPrice || 0;
      const finalRetailPrice = calculateFinalPrice(rarity, marketPrice);
      
      // Debug Mew cards specifically
      if (priceData.productName?.toLowerCase().includes('mew')) {
        console.log('[SearchWithPrices] Mew card debug:', {
          productId: priceData.productId,
          productName: priceData.productName,
          rarity: priceData.rarity,
          marketPrice,
          finalRetailPrice,
          rarityName: priceData.rarityName
        });
      }
      
      return {
        id: `tcg-${priceData.productId}`,
        productId: priceData.productId, // Add numeric productId for navigation
        name: priceData.productName,
        detailUrl: priceData.url || `https://www.tcgplayer.com/product/${priceData.productId}`,
        imageUrl: priceData.imageUrl || '/placeholder-card.svg',
        categoryName: priceData.setName || 'Unknown Set',
        offers: finalRetailPrice 
          ? [`$${finalRetailPrice.toFixed(2)}`]
          : ['Price N/A'],
        provider: 'TCGPlayer',
        rarity: priceData.rarity || 'Unknown',
        setId: priceData.setId?.toString() || '',
        cardId: `tcg-${priceData.productId}`,
        types: priceData.energyType || [],
        weaknesses: [],
        resistances: [],
        attacks: [],
        hp: null,
        nationalPokedexNumbers: [],
        // Stock information
        stock: totalStock,
        inStock,
        // Printing information
        printing: priceData.printing,
        variants: priceData.variants,
        // Enhanced pricing data
        pricing: {
          marketPrice: priceData.marketPrice, // Original TCGPlayer price
          retailPrice: finalRetailPrice, // Our calculated retail price
          lowPrice: priceData.lowestPrice,
          midPrice: priceData.marketPrice, // Use market price as median
          highPrice: priceData.lowestPriceWithShipping || priceData.marketPrice,
          source: 'TCGPlayer',
          lastUpdated: new Date().toISOString(),
        },
      };
    });

    // Filter out blacklisted cards and "Code Card" rarity
    const filteredCards = enrichedCards.filter(card => {
      const productId = card.productId.toString();
      const isBlacklisted = blacklist.includes(productId);
      const isCodeCard = card.rarity && card.rarity.toLowerCase().includes('code card');
      
      if (isBlacklisted) {
        console.log(`[SearchWithPrices] Filtering blacklisted card: ${card.name} (${productId})`);
      }
      if (isCodeCard) {
        console.log(`[SearchWithPrices] Filtering code card: ${card.name}`);
      }
      
      return !isBlacklisted && !isCodeCard;
    });

    console.log(`[SearchWithPrices] Filtered ${enrichedCards.length - filteredCards.length} cards (blacklist + code cards)`);

    // CRITICAL: Sort cards with IN STOCK ALWAYS FIRST, then by price
    const sortedCards = filteredCards.sort((a, b) => {
      // First priority: in-stock cards ALWAYS at top
      const aInStock = a.inStock || false;
      const bInStock = b.inStock || false;
      
      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      
      // Second priority: sort by price (lowest first)
      const aPrice = a.pricing?.retailPrice || a.pricing?.marketPrice || 0;
      const bPrice = b.pricing?.retailPrice || b.pricing?.marketPrice || 0;
      
      return aPrice - bPrice;
    });

    console.log(`[SearchWithPrices] Sorted ${sortedCards.length} cards (in-stock first, then by price)`);

    // Now paginate the sorted results
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedCards = sortedCards.slice(startIdx, endIdx);
    
    console.log(`[SearchWithPrices] Returning page ${page}: cards ${startIdx + 1}-${Math.min(endIdx, sortedCards.length)} of ${sortedCards.length} sorted cards`);

    return NextResponse.json({
      items: paginatedCards,
      total: totalAvailable, // Total cards available from TCGPlayer
      page,
      pageSize,
      count: paginatedCards.length, // Cards returned in this response
      totalCount: sortedCards.length, // Total cards in our sorted batch
      providers: ['tcgplayer'],
      games: [{ id: "pokemon", name: "Pokémon" }],
      pricesIncluded: true,
      // Pagination metadata (based on our sorted batch, not TCGPlayer's total)
      hasNextPage: endIdx < sortedCards.length,
      hasPrevPage: page > 1,
      totalPages: Math.ceil(sortedCards.length / pageSize),
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in search-with-prices API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results', details: errorMessage },
      { status: 500 }
    );
  }
}
