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

    // Fetch from TCGPlayer directly
    const tcgResults = await searchTCGPlayerPrices(searchQuery, {
      pageSize,
      page,
    });

    console.log(`[SearchWithPrices] Got ${tcgResults.length} results from TCGPlayer`);

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
      const cardNumber = priceData.productId?.toString() || `${index + 1}`;
      const stock = inventoryMap[priceData.productId.toString()] || 0;
      const inStock = stock > 0;
      
      return {
        id: `tcg-${priceData.productId}`,
        name: priceData.productName,
        detailUrl: priceData.url || `https://www.tcgplayer.com/product/${priceData.productId}`,
        imageUrl: priceData.imageUrl || '/placeholder-card.svg',
        categoryName: priceData.setName || 'Unknown Set',
        offers: priceData.marketPrice 
          ? [`$${priceData.marketPrice.toFixed(2)}`]
          : ['Price N/A'],
        provider: 'TCGPlayer',
        rarity: priceData.rarityName || 'Unknown',
        setId: priceData.setId?.toString() || '',
        cardId: `tcg-${priceData.productId}`,
        types: priceData.customAttributes?.energyType || [],
        weaknesses: [],
        resistances: [],
        attacks: [],
        hp: null,
        nationalPokedexNumbers: [],
        // Stock information
        stock,
        inStock,
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
      total: enrichedCards.length,
      page,
      pageSize,
      count: enrichedCards.length,
      totalCount: enrichedCards.length,
      providers: ['tcgplayer'],
      games: [{ id: "pokemon", name: "Pokémon" }],
      pricesIncluded: true,
    });
    
  } catch (error: any) {
    console.error('Error in search-with-prices API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results', details: error.message },
      { status: 500 }
    );
  }
}
