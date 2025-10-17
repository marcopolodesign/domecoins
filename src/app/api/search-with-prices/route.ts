import { NextRequest, NextResponse } from 'next/server';
import { searchTCGPlayerPrices } from '@/lib/tcgplayer-price-scraper';
import { getInventory } from '@/lib/kv';

/**
 * Search API with TCGPlayer Prices
 * 
 * Uses TCGPlayer's API directly for real-time card data and pricing
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Use default search if no query provided
    const searchQuery = query || 'pokemon';

    console.log(`[SearchWithPrices] Query: ${searchQuery}, pageSize: ${pageSize}, page: ${page}`);
    console.log(`[SearchWithPrices] Calculated offset: from=${(page - 1) * pageSize}, limit=${pageSize}`);

    // Fetch from TCGPlayer directly with proper pagination
    const tcgResponse = await searchTCGPlayerPrices(searchQuery, {
      pageSize: pageSize,
      page: page,
    });

    const tcgResults = tcgResponse.cards;
    const totalAvailable = tcgResponse.totalResults;

    console.log(`[SearchWithPrices] Got ${tcgResults.length} results from TCGPlayer (${totalAvailable} total available)`);

    // Get inventory for all product IDs
    const productIds = tcgResults.map(r => r.productId.toString());
    let inventoryMap: Record<string, number> = {};
    
    try {
      // Fetch inventory directly from KV
      inventoryMap = await getInventory(productIds);
      console.log('[SearchWithPrices] Fetched inventory for', productIds.length, 'products');
    } catch (error) {
      console.error('[SearchWithPrices] Error fetching inventory from KV:', error);
    }

    // Convert TCGPlayer results to our card format
    const enrichedCards = tcgResults.map((priceData, index) => {
      const stock = inventoryMap[priceData.productId.toString()] || 0;
      const inStock = stock > 0;
      
      // Debug first card to check rarity
      if (index === 0) {
        console.log('[SearchWithPrices] First card rarity check:', {
          productName: priceData.productName,
          rarity: priceData.rarity,
          hasRarity: !!priceData.rarity
        });
      }
      
      return {
        id: `tcg-${priceData.productId}`,
        productId: priceData.productId, // Add numeric productId for navigation
        name: priceData.productName,
        detailUrl: priceData.url || `https://www.tcgplayer.com/product/${priceData.productId}`,
        imageUrl: priceData.imageUrl || '/placeholder-card.svg',
        categoryName: priceData.setName || 'Unknown Set',
        offers: priceData.marketPrice 
          ? [`$${priceData.marketPrice.toFixed(2)}`]
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
        stock,
        inStock,
        // Printing information
        printing: priceData.printing,
        variants: priceData.variants,
        // Enhanced pricing data
        pricing: {
          marketPrice: priceData.marketPrice,
          lowPrice: priceData.lowestPrice,
          midPrice: priceData.marketPrice, // Use market price as median
          highPrice: priceData.lowestPriceWithShipping || priceData.marketPrice,
          source: 'TCGPlayer',
          lastUpdated: new Date().toISOString(),
        },
      };
    });

    return NextResponse.json({
      items: enrichedCards,
      total: totalAvailable, // Total cards available across all pages
      page,
      pageSize,
      count: enrichedCards.length, // Cards returned in this response
      totalCount: totalAvailable, // Total cards available for pagination
      providers: ['tcgplayer'],
      games: [{ id: "pokemon", name: "Pokémon" }],
      pricesIncluded: true,
      // Pagination metadata
      hasNextPage: (page * pageSize) < totalAvailable,
      hasPrevPage: page > 1,
      totalPages: Math.ceil(totalAvailable / pageSize),
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
