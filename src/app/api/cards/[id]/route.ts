import { NextRequest, NextResponse } from 'next/server';
import { fetchProductDetails } from '@/lib/tcgplayer-price-scraper';
import { calculateFinalPrice } from '@/utils/priceFormulas';

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
    
    // Apply price formulas to each variant
    if (product.variants && product.variants.length > 0) {
      product.variants = product.variants.map(variant => {
        const rarity = product.rarity || 'Unknown';
        const marketPrice = variant.marketPrice || 0;
        const retailPrice = calculateFinalPrice(rarity, marketPrice);
        
        // Debug logging for Pikachu
        if (product.productName?.toLowerCase().includes('pikachu') && productId === 500263) {
          console.log('[CardDetailAPI] Pikachu 500263 variant pricing:', {
            productId,
            productName: product.productName,
            rarity,
            printing: variant.printing,
            marketPrice,
            retailPrice,
          });
        }
        
        return {
          ...variant,
          retailPrice, // Add calculated retail price
        };
      });
    }
    
    // Also calculate main product retail price
    const mainRetailPrice = calculateFinalPrice(
      product.rarity || 'Unknown',
      product.marketPrice || 0
    );
    
    // Debug logging for Pikachu
    if (product.productName?.toLowerCase().includes('pikachu') && productId === 500263) {
      console.log('[CardDetailAPI] Pikachu 500263 main pricing:', {
        productId,
        productName: product.productName,
        rarity: product.rarity,
        marketPrice: product.marketPrice,
        mainRetailPrice,
      });
    }
    
    return NextResponse.json({
      ...product,
      retailPrice: mainRetailPrice,
    });
    
  } catch (error) {
    console.error('[API] Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

