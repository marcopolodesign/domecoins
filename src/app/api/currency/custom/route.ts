import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (will reset on deployment, but that's acceptable for this use case)
// For production, you should use Vercel KV or a database
let customPriceCache: {
  customPrice: number | null;
  updatedAt: string | null;
} = {
  customPrice: null,
  updatedAt: null,
};

// Get custom price or fallback to API
export async function GET(request: NextRequest) {
  try {
    // Check if custom price exists and is still valid
    if (customPriceCache.customPrice && customPriceCache.updatedAt) {
      const daysSinceUpdate = (Date.now() - new Date(customPriceCache.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        return NextResponse.json({
          customPrice: customPriceCache.customPrice,
          updatedAt: customPriceCache.updatedAt,
          isCustom: true,
        });
      }
    }

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
      });
    }

    // Final fallback
    return NextResponse.json({
      bluePrice: 1200,
      customPrice: null,
      isCustom: false,
    });

  } catch (error: any) {
    console.error('Error fetching currency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency', details: error.message },
      { status: 500 }
    );
  }
}

// Set custom price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { price } = body;

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Invalid price provided' },
        { status: 400 }
      );
    }

    // Store in memory
    customPriceCache = {
      customPrice: price,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      customPrice: price,
      updatedAt: customPriceCache.updatedAt,
      note: 'Price stored in memory. Will reset on redeployment. For persistent storage, upgrade to Vercel KV.',
    });

  } catch (error: any) {
    console.error('Error setting custom price:', error);
    return NextResponse.json(
      { error: 'Failed to set custom price', details: error.message },
      { status: 500 }
    );
  }
}

// Delete custom price (revert to API)
export async function DELETE(request: NextRequest) {
  try {
    customPriceCache = {
      customPrice: null,
      updatedAt: null,
    };

    return NextResponse.json({
      success: true,
      message: 'Custom price removed, using API',
    });

  } catch (error: any) {
    console.error('Error deleting custom price:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom price', details: error.message },
      { status: 500 }
    );
  }
}

