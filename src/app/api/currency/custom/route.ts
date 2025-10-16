import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CUSTOM_PRICE_FILE = path.join(process.cwd(), 'data', 'custom-dolar-price.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get custom price or fallback to API
export async function GET(request: NextRequest) {
  try {
    ensureDataDir();
    
    // Check if custom price exists
    if (fs.existsSync(CUSTOM_PRICE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOM_PRICE_FILE, 'utf-8'));
      if (data.customPrice && data.updatedAt) {
        // Check if custom price is still valid (less than 7 days old)
        const daysSinceUpdate = (Date.now() - new Date(data.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          return NextResponse.json({
            customPrice: data.customPrice,
            updatedAt: data.updatedAt,
            isCustom: true,
          });
        }
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

    ensureDataDir();

    // Save custom price
    const data = {
      customPrice: price,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(CUSTOM_PRICE_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      customPrice: price,
      updatedAt: data.updatedAt,
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
    if (fs.existsSync(CUSTOM_PRICE_FILE)) {
      fs.unlinkSync(CUSTOM_PRICE_FILE);
    }

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

