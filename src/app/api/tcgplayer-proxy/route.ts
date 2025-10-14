import { NextRequest, NextResponse } from 'next/server';
import { searchTCGPlayerPrices } from '@/lib/tcgplayer-price-scraper';

/**
 * TCGPlayer Proxy API
 * 
 * Proxies requests to TCGPlayer's search API
 * This allows us to scrape from our server and handle CORS
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[TCGPlayer Proxy] Searching for: ${query}`);
    
    // Call the TCGPlayer scraper
    const cards = await searchTCGPlayerPrices(query);
    
    return NextResponse.json({
      success: true,
      query,
      count: cards.length,
      cards,
    });
    
  } catch (error: any) {
    console.error('[TCGPlayer Proxy] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || null,
    }, { status: 500 });
  }
}

