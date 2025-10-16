import { NextRequest, NextResponse } from 'next/server'
import { getCustomPrice as getCustomPriceFromKV } from '@/lib/kv'

// Check for custom price from KV
async function getCustomPrice(): Promise<number | null> {
  try {
    const { price } = await getCustomPriceFromKV();
    
    if (price !== null) {
      console.log(`[CurrencyAPI] Using custom dolar price from KV: $${price}`);
      return price;
    }
  } catch (error) {
    console.error('[CurrencyAPI] Error fetching custom price from KV:', error);
  }
  return null;
}

// Multiple sources for dolar blue rate
const CURRENCY_SOURCES = [
  {
    name: 'DolarApi',
    url: 'https://dolarapi.com/v1/dolares/blue',
    parseResponse: (data: any) => parseFloat(data.venta),
  },
  {
    name: 'Ambito',
    url: 'https://mercados.ambito.com/dolar/informal/variacion',
    parseResponse: (data: any) => parseFloat(data.venta),
  },
]

async function fetchFromSource(source: typeof CURRENCY_SOURCES[0]): Promise<number | null> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Pokemon-TCG-Argentina/1.0',
      },
      next: { revalidate: 60 }, // Cache for 1 minute only
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const rate = source.parseResponse(data)

    if (isNaN(rate) || rate <= 0) {
      throw new Error('Invalid rate value')
    }

    return rate
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[CurrencyAPI] GET request received');
    
    // First, check for custom price
    const customPrice = await getCustomPrice();
    if (customPrice !== null) {
      console.log('[CurrencyAPI] Returning CUSTOM price:', customPrice);
      return NextResponse.json({
        blueRate: customPrice,
        rate: customPrice, // Also include as 'rate' for compatibility
        source: 'Custom',
        isCustom: true,
        timestamp: new Date().toISOString(),
      });
    }

    console.log('[CurrencyAPI] No custom price, fetching from external sources...');
    
    // Try each source until we get a valid rate
    for (const source of CURRENCY_SOURCES) {
      const rate = await fetchFromSource(source)
      
      if (rate !== null) {
        console.log('[CurrencyAPI] Returning rate from', source.name, ':', rate);
        return NextResponse.json({
          rate,
          blueRate: rate, // Also include as 'blueRate' for compatibility
          source: source.name,
          timestamp: new Date().toISOString(),
          success: true,
        })
      }
    }

    // If all sources fail, return fallback rate
    return NextResponse.json({
      rate: 1335, // Fallback rate
      source: 'fallback',
      timestamp: new Date().toISOString(),
      success: false,
      error: 'All currency sources failed, using fallback rate',
    }, { status: 206 }) // 206 Partial Content

  } catch (error) {
    console.error('Currency API error:', error)
    
    return NextResponse.json({
      rate: 1335, // Fallback rate
      source: 'fallback',
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

// Add CORS headers for client-side requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
