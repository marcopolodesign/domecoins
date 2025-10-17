import { NextRequest, NextResponse } from 'next/server';
import { fetchProductDetails } from '@/lib/tcgplayer-price-scraper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 requires awaiting params
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching product details for ID: ${productId}`);
    
    const product = await fetchProductDetails(productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('[API] Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

