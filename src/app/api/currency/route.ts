import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CUSTOM_PRICE_FILE = path.join(process.cwd(), 'data', 'custom-dolar-price.json');

// Check for custom price first
async function getCustomPrice(): Promise<number | null> {
  try {
    if (fs.existsSync(CUSTOM_PRICE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOM_PRICE_FILE, 'utf-8'));
      if (data.customPrice && data.updatedAt) {
        // Check if custom price is still valid (less than 7 days old)
        const daysSinceUpdate = (Date.now() - new Date(data.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          console.log(`Using custom dolar price: $${data.customPrice}`);
          return data.customPrice;
        }
      }
    }
  } catch (error) {
    console.error('Error reading custom price:', error);
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
      next: { revalidate: 300 }, // Cache for 5 minutes
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
    // First, check for custom price
    const customPrice = await getCustomPrice();
    if (customPrice !== null) {
      return NextResponse.json({
        blueRate: customPrice,
        source: 'Custom',
        isCustom: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Try each source until we get a valid rate
    for (const source of CURRENCY_SOURCES) {
      const rate = await fetchFromSource(source)
      
      if (rate !== null) {
        return NextResponse.json({
          rate,
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
