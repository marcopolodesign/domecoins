import { NextRequest, NextResponse } from 'next/server';
import { 
  getInventory, 
  setInventoryBulk, 
  clearInventory, 
  getInventoryCount 
} from '@/lib/kv';

// Get inventory for specific card IDs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids'); // Comma-separated IDs
    
    const totalCards = await getInventoryCount();
    console.log('[InventoryAPI] GET request - Total items in KV:', totalCards);
    
    if (idsParam) {
      // Return stock for specific IDs
      const ids = idsParam.split(',').map(id => id.trim());
      const inventory = await getInventory(ids);
      
      const inStockCount = Object.values(inventory).filter(q => q > 0).length;
      console.log('[InventoryAPI] Requested IDs:', ids.length, 'Found in stock:', inStockCount);
      
      return NextResponse.json({
        inventory,
        totalCards,
      });
    }
    
    // Return all inventory
    const inventory = await getInventory();
    
    return NextResponse.json({
      inventory,
      totalCards,
    });

  } catch (error: any) {
    console.error('[InventoryAPI] Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    );
  }
}

// Upload CSV inventory
export async function POST(request: NextRequest) {
  try {
    console.log('[InventoryAPI] POST request - Uploading CSV to KV...');
    
    const body = await request.json();
    const { csvData } = body;

    if (!csvData || typeof csvData !== 'string') {
      console.error('[InventoryAPI] Invalid CSV data provided');
      return NextResponse.json(
        { error: 'Invalid CSV data provided' },
        { status: 400 }
      );
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    
    console.log('[InventoryAPI] CSV has', lines.length, 'lines');
    
    if (lines.length < 2) {
      console.error('[InventoryAPI] CSV file is empty or invalid');
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Skip header row
    const dataLines = lines.slice(1);
    
    const oldCount = await getInventoryCount();
    console.log('[InventoryAPI] Clearing existing inventory (', oldCount, 'items)');
    
    // Clear existing inventory
    await clearInventory();
    
    let processedCount = 0;
    let errorCount = 0;
    const inventoryItems: Record<string, number> = {};
    
    // Parse each line
    dataLines.forEach((line, index) => {
      if (!line.trim()) return; // Skip empty lines
      
      try {
        // CSV format: TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity
        const columns = line.split(',');
        
        if (columns.length >= 8) {
          const tcgplayerId = columns[0].trim();
          const addToQuantity = parseInt(columns[7].trim()) || 0;
          
          if (tcgplayerId && addToQuantity > 0) {
            // Add or update inventory
            const currentQty = inventoryItems[tcgplayerId] || 0;
            inventoryItems[tcgplayerId] = currentQty + addToQuantity;
            processedCount++;
          }
        }
      } catch (err) {
        errorCount++;
        console.error(`[InventoryAPI] Error parsing line ${index + 2}:`, err);
      }
    });

    // Bulk set all inventory items in KV
    const totalCards = await setInventoryBulk(inventoryItems);

    console.log('[InventoryAPI] Upload complete:', {
      processedCount,
      errorCount,
      totalCards
    });
    
    // Log first 5 items for debugging
    const sampleItems = Object.entries(inventoryItems)
      .slice(0, 5)
      .map(([id, qty]) => ({ id, qty }));
    console.log('[InventoryAPI] Sample inventory items:', sampleItems);
    
    return NextResponse.json({
      success: true,
      processedCount,
      errorCount,
      totalCards,
      updatedAt: new Date().toISOString(),
      storage: 'Vercel KV (persistent)',
    });

  } catch (error: any) {
    console.error('[InventoryAPI] Error uploading inventory:', error);
    return NextResponse.json(
      { error: 'Failed to upload inventory', details: error.message },
      { status: 500 }
    );
  }
}

// Clear inventory
export async function DELETE(request: NextRequest) {
  try {
    const previousSize = await getInventoryCount();
    await clearInventory();

    console.log('[InventoryAPI] Cleared', previousSize, 'items from KV');

    return NextResponse.json({
      success: true,
      message: `Cleared ${previousSize} items from inventory`,
    });

  } catch (error: any) {
    console.error('[InventoryAPI] Error clearing inventory:', error);
    return NextResponse.json(
      { error: 'Failed to clear inventory', details: error.message },
      { status: 500 }
    );
  }
}
