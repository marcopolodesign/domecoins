import { NextRequest, NextResponse } from 'next/server';
import { getCustomPrice, setCustomPrice, clearCustomPrice } from '@/lib/kv';

// Get custom price from Vercel KV
export async function GET(request: NextRequest) {
  try {
    console.log('[CustomPriceAPI] GET request - Fetching from KV...');
    
    const { price, updatedAt } = await getCustomPrice();
    
    if (price !== null) {
      console.log('[CustomPriceAPI] Returning custom price from KV:', price);
      return NextResponse.json({
        customPrice: price,
        updatedAt,
        isCustom: true,
        storage: 'Vercel KV',
      });
    }
    
    console.log('[CustomPriceAPI] No custom price found in KV');

    // Fallback to blue dollar API
    const blueResponse = await fetch('https://dolarapi.com/v1/dolares/blue', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (blueResponse.ok) {
      const blueData = await blueResponse.json();
      return NextResponse.json({
        bluePrice: blueData.venta,
        customPrice: null,
        isCustom: false,
        storage: 'External API',
      });
    }

    // Final fallback
    return NextResponse.json({
      bluePrice: 1200,
      customPrice: null,
      isCustom: false,
      storage: 'Fallback',
    });

  } catch (error: any) {
    console.error('[CustomPriceAPI] Error fetching custom price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency', details: error.message },
      { status: 500 }
    );
  }
}

// Set custom price in Vercel KV
export async function POST(request: NextRequest) {
  try {
    console.log('[CustomPriceAPI] POST request - Setting custom price in KV');
    
    const body = await request.json();
    const { price } = body;
    
    console.log('[CustomPriceAPI] Received price:', price);

    if (!price || typeof price !== 'number' || price <= 0) {
      console.error('[CustomPriceAPI] Invalid price provided:', price);
      return NextResponse.json(
        { error: 'Invalid price provided' },
        { status: 400 }
      );
    }

    // Store in Vercel KV
    await setCustomPrice(price);
    
    const updatedAt = new Date().toISOString();
    
    console.log('[CustomPriceAPI] Custom price set successfully in KV:', price);

    return NextResponse.json({
      success: true,
      customPrice: price,
      updatedAt,
      storage: 'Vercel KV (persistent)',
      note: 'Price will persist across deployments.',
    });

  } catch (error: any) {
    console.error('[CustomPriceAPI] Error setting custom price:', error);
    return NextResponse.json(
      { error: 'Failed to set custom price', details: error.message },
      { status: 500 }
    );
  }
}

// Delete custom price from Vercel KV (revert to API)
export async function DELETE(request: NextRequest) {
  try {
    console.log('[CustomPriceAPI] DELETE request - Removing custom price from KV');
    
    await clearCustomPrice();

    console.log('[CustomPriceAPI] Custom price removed from KV');

    return NextResponse.json({
      success: true,
      message: 'Custom price removed, using API',
      storage: 'Vercel KV',
    });

  } catch (error: any) {
    console.error('[CustomPriceAPI] Error deleting custom price:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom price', details: error.message },
      { status: 500 }
    );
  }
}
