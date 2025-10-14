import { NextRequest, NextResponse } from 'next/server';
import { searchLocalCards } from '@/lib/local-pokemon-data';
import { searchTCGPlayerPrices } from '@/lib/tcgplayer-price-scraper';

/**
 * Enhanced Search API
 * 
 * Combines:
 * 1. Card data from local GitHub repository (complete card info)
 * 2. Real-time prices from TCGPlayer (actual market prices)
 * 
 * This is the best of both worlds!
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const includePrices = searchParams.get('prices') !== 'false'; // default true
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[SearchWithPrices] Query: ${query}, includePrices: ${includePrices}`);

    // Step 1: Get card data from local GitHub data (FAST)
    const localResults = await searchLocalCards(query, {
      pageSize,
      page,
    });

    console.log(`[SearchWithPrices] Found ${localResults.data.length} cards from local data`);

    // Step 2: If prices requested, scrape TCGPlayer (SLOW but REAL prices)
    let pricesMap = new Map<string, any>();
    
    if (includePrices && localResults.data.length > 0) {
      try {
        console.log(`[SearchWithPrices] Fetching prices from TCGPlayer...`);
        
        // Search TCGPlayer with the same query
        const tcgPrices = await searchTCGPlayerPrices(query);
        
        console.log(`[SearchWithPrices] Got ${tcgPrices.length} price results from TCGPlayer`);
        
        // Create a map of card name -> price for easy lookup
        tcgPrices.forEach(priceData => {
          const key = priceData.productName.toLowerCase().trim();
          pricesMap.set(key, priceData);
        });
        
      } catch (error: any) {
        console.error('[SearchWithPrices] TCGPlayer scraping failed:', error.message);
        // Continue without prices rather than failing completely
      }
    }

    // Step 3: Combine local card data with TCGPlayer prices
    const enrichedCards = localResults.data.map(card => {
      const cardKey = card.name.toLowerCase().trim();
      const priceData = pricesMap.get(cardKey);
      
      return {
        id: card.id,
        name: card.name,
        detailUrl: priceData?.url || `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}`,
        imageUrl: card.images?.large || card.images?.small || priceData?.imageUrl || '/placeholder-card.svg',
        categoryName: card.set?.name || 'Unknown Set',
        offers: priceData?.marketPrice 
          ? [`$${priceData.marketPrice.toFixed(2)}`]
          : ['Price N/A'],
        provider: 'GitHub + TCGPlayer',
        rarity: card.rarity,
        setId: card.set?.id,
        cardId: card.id,
        types: card.types || [],
        weaknesses: card.weaknesses || [],
        resistances: card.resistances || [],
        attacks: card.attacks || [],
        hp: card.hp,
        nationalPokedexNumbers: card.nationalPokedexNumbers || [],
        // Enhanced pricing data
        pricing: priceData ? {
          marketPrice: priceData.marketPrice,
          lowPrice: priceData.lowPrice,
          midPrice: priceData.midPrice,
          highPrice: priceData.highPrice,
          source: 'TCGPlayer',
          lastUpdated: new Date().toISOString(),
        } : null,
      };
    });

    return NextResponse.json({
      items: enrichedCards,
      total: enrichedCards.length,
      page: localResults.page,
      pageSize: localResults.pageSize,
      count: enrichedCards.length,
      totalCount: localResults.totalCount,
      providers: ['github', 'tcgplayer'],
      games: [{ id: "pokemon", name: "Pokémon" }],
      pricesIncluded: includePrices && pricesMap.size > 0,
    });
    
  } catch (error: any) {
    console.error('Error in search-with-prices API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results', details: error.message },
      { status: 500 }
    );
  }
}

