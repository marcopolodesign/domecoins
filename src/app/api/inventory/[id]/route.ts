import { NextRequest, NextResponse } from 'next/server';
import { getInventory } from '@/lib/kv';

/**
 * Get inventory for a specific product ID
 * Returns all variants with their stock quantities
 * 
 * Example response:
 * {
 *   "productId": "178894",
 *   "variants": {
 *     "Holofoil": 2,
 *     "Reverse Holofoil": 1
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = id;
    
    console.log(`[InventoryAPI] GET inventory for product: ${productId}`);
    
    // Get all inventory
    const rawInventory = await getInventory();
    
    // Filter for this specific productId
    const variants: Record<string, number> = {};
    
    for (const [key, quantity] of Object.entries(rawInventory)) {
      if (quantity > 0) {
        // Parse "productId:printing" format
        const [invProductId, printing] = key.includes(':') 
          ? key.split(':') 
          : [key, 'Normal']; // Backward compatibility
        
        if (invProductId === productId) {
          variants[printing] = quantity;
        }
      }
    }
    
    console.log(`[InventoryAPI] Product ${productId} has ${Object.keys(variants).length} variants in stock:`, variants);
    
    return NextResponse.json({
      productId,
      variants,
      inStock: Object.keys(variants).length > 0,
    });

  } catch (error: any) {
    console.error('[InventoryAPI] Error fetching product inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    );
  }
}

