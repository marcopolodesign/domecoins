import { NextRequest, NextResponse } from 'next/server';

// Fallback data for when PreciosTCG API is rate limited
const getFallbackData = (query: string) => ({
  items: [
    {
      name: `${query} - Base Set (Shadowless)`,
      detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
      imageUrl: "/placeholder-card.svg",
      categoryName: "Base Set",
      offers: ["$15.99", "$12.50", "$18.25"],
      provider: "TCGPlayer"
    },
    {
      name: `${query} - Evolutions (Holo)`,
      detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
      imageUrl: "/placeholder-card.svg",
      categoryName: "Evolutions",
      offers: ["$8.25", "$6.99", "$9.50"],
      provider: "TCGPlayer"
    },
    {
      name: `${query} - Modern Set (VMAX)`,
      detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
      imageUrl: "/placeholder-card.svg",
      categoryName: "Modern Set",
      offers: ["$4.50", "$3.99", "$5.25"],
      provider: "TCGPlayer"
    },
    {
      name: `${query} - Promo Card`,
      detailUrl: "https://www.tcgplayer.com/search/pokemon/product",
      imageUrl: "/placeholder-card.svg",
      categoryName: "Promo",
      offers: ["$2.99", "$2.25", "$3.50"],
      provider: "TCGPlayer"
    }
  ],
  total: 4,
  providers: ["tcgplayer", "trollandtoad", "pricecharting"],
  games: [
    { id: "pokemon", name: "Pokémon" },
    { id: "magic", name: "Magic: The Gathering" },
    { id: "yugioh", name: "Yu-Gi-Oh!" }
  ]
});

// Simple rate limiting - prevent too many requests
const requestTimes: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 5;

export async function GET(request: NextRequest) {
  try {
    // Simple rate limiting
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old request times
    while (requestTimes.length > 0 && requestTimes[0] < oneMinuteAgo) {
      requestTimes.shift();
    }
    
    // Check if we've exceeded rate limit
    if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
      console.log('Rate limit exceeded, using fallback data');
      const fallbackData = getFallbackData(query || 'Pokemon');
      return NextResponse.json(fallbackData);
    }
    
    // Add current request time
    requestTimes.push(now);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const provider = searchParams.get('provider') || 'tcgplayer';
    const game = searchParams.get('game') || 'pokemon';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Try different API endpoints that might be used by the actual website
    const possibleUrls = [
      `https://www.preciostcg.com/api/search?query=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}&game=${encodeURIComponent(game)}`,
      `https://www.preciostcg.com/search?query=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}&game=${encodeURIComponent(game)}`,
      `https://www.preciostcg.com/api/cards/search?q=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}&game=${encodeURIComponent(game)}`
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
      const fallbackData = getFallbackData(query);
      return NextResponse.json(fallbackData);
    }

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - return fallback data
        console.log('PreciosTCG API rate limited, using fallback data');
        const fallbackData = getFallbackData(query);
        return NextResponse.json(fallbackData);
      }
      throw new Error(`PreciosTCG API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from PreciosTCG:', error);
    
    // Return fallback data instead of error
    if (query) {
      const fallbackData = getFallbackData(query);
      return NextResponse.json(fallbackData);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}

