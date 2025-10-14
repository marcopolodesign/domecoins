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
      
      // Extract set name from card ID (format: "base1-1" → "base1")
      // Or use TCGPlayer set name as fallback
      let setName = 'Unknown Set';
      let setId = '';
      
      // Try to get set from card.set first
      if (card.set?.name) {
        setName = card.set.name;
        setId = card.set.id || '';
      }
      // Fallback: Extract from card ID
      else if (card.id) {
        const parts = card.id.split('-');
        if (parts.length > 1) {
          setId = parts[0]; // e.g., "base1", "cel25", "sv3pt5"
          // Map common set IDs to readable names
          setName = getSetNameFromId(setId);
        }
      }
      // Fallback: Use TCGPlayer set name
      if (setName === 'Unknown Set' && priceData?.setName) {
        setName = priceData.setName;
      }
      
      return {
        id: card.id,
        name: card.name,
        detailUrl: priceData?.url || `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}`,
        imageUrl: card.images?.large || card.images?.small || priceData?.imageUrl || '/placeholder-card.svg',
        categoryName: setName,
        offers: priceData?.marketPrice 
          ? [`$${priceData.marketPrice.toFixed(2)}`]
          : ['Price N/A'],
        provider: 'GitHub + TCGPlayer',
        rarity: card.rarity || priceData?.rarity,
        setId: setId || priceData?.setId?.toString(),
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
          lowPrice: priceData.lowestPrice,
          midPrice: priceData.medianPrice,
          highPrice: priceData.lowestPriceWithShipping,
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

/**
 * Map set IDs to readable names
 * This maps the GitHub repository set IDs to user-friendly names
 */
function getSetNameFromId(setId: string): string {
  const setNames: Record<string, string> = {
    // Base sets
    'base1': 'Base Set',
    'base2': 'Jungle',
    'base3': 'Fossil',
    'base4': 'Base Set 2',
    'base5': 'Team Rocket',
    'base6': 'Legendary Collection',
    
    // Gym sets
    'gym1': 'Gym Heroes',
    'gym2': 'Gym Challenge',
    
    // Neo sets
    'neo1': 'Neo Genesis',
    'neo2': 'Neo Discovery',
    'neo3': 'Neo Revelation',
    'neo4': 'Neo Destiny',
    
    // SWSH sets
    'swsh1': 'Sword & Shield',
    'swsh2': 'Rebel Clash',
    'swsh3': 'Darkness Ablaze',
    'swsh4': 'Vivid Voltage',
    'swsh5': 'Battle Styles',
    'swsh6': 'Chilling Reign',
    'swsh7': 'Evolving Skies',
    'swsh8': 'Fusion Strike',
    'swsh9': 'Brilliant Stars',
    'swsh10': 'Astral Radiance',
    'swsh11': 'Lost Origin',
    'swsh12': 'Silver Tempest',
    'swsh12pt5': 'Crown Zenith',
    
    // Celebrations
    'cel25': 'Celebrations',
    'cel25c': 'Celebrations: Classic Collection',
    
    // Scarlet & Violet
    'sv1': 'Scarlet & Violet',
    'sv2': 'Paldea Evolved',
    'sv3': 'Obsidian Flames',
    'sv3pt5': '151',
    'sv4': 'Paradox Rift',
    'sv4pt5': 'Paldean Fates',
    'sv5': 'Temporal Forces',
    'sv6': 'Twilight Masquerade',
    'sv7': 'Shrouded Fable',
    'sv8': 'Surging Sparks',
    'sv9': 'Supercharged Breaker',
    'sv9pt5': 'Destined Rivals',
    
    // XY sets
    'xy1': 'XY Base Set',
    'xy2': 'Flashfire',
    'xy3': 'Furious Fists',
    'xy4': 'Phantom Forces',
    'xy5': 'Primal Clash',
    'xy6': 'Roaring Skies',
    'xy7': 'Ancient Origins',
    'xy8': 'BREAKthrough',
    'xy9': 'BREAKpoint',
    'xy10': 'Fates Collide',
    'xy11': 'Steam Siege',
    'xy12': 'Evolutions',
    
    // Sun & Moon
    'sm1': 'Sun & Moon Base Set',
    'sm2': 'Guardians Rising',
    'sm3': 'Burning Shadows',
    'sm4': 'Crimson Invasion',
    'sm5': 'Ultra Prism',
    'sm6': 'Forbidden Light',
    'sm7': 'Celestial Storm',
    'sm8': 'Lost Thunder',
    'sm9': 'Team Up',
    'sm10': 'Unbroken Bonds',
    'sm11': 'Unified Minds',
    'sm12': 'Cosmic Eclipse',
    
    // Black & White
    'bw1': 'Black & White',
    'bw2': 'Emerging Powers',
    'bw3': 'Noble Victories',
    'bw4': 'Next Destinies',
    'bw5': 'Dark Explorers',
    'bw6': 'Dragons Exalted',
    'bw7': 'Boundaries Crossed',
    'bw8': 'Plasma Storm',
    'bw9': 'Plasma Freeze',
    'bw10': 'Plasma Blast',
    'bw11': 'Legendary Treasures',
  };
  
  return setNames[setId] || setId.toUpperCase();
}
