import { NextRequest, NextResponse } from 'next/server';
import { 
  getInventory, 
  setInventoryBulk, 
  clearInventory, 
  getInventoryCount 
} from '@/lib/kv';

/**
 * Normalize printing names to standard format
 * Expected printings: normal, holo, reverse-holo
 */
function normalizePrinting(printing: string): string {
  const normalized = printing.toLowerCase().trim();
  
  // Map common variations to standard names
  const printingMap: Record<string, string> = {
    'normal': 'Normal',
    '': 'Normal', // Empty = normal
    'holo': 'Holofoil',
    'holofoil': 'Holofoil',
    'reverse-holo': 'Reverse Holofoil',
    'reverse holo': 'Reverse Holofoil',
    'reverse holofoil': 'Reverse Holofoil',
    'reverse': 'Reverse Holofoil',
  };
  
  return printingMap[normalized] || 'Normal';
}

// Get inventory for specific card IDs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids'); // Comma-separated IDs
    
    const totalCards = await getInventoryCount();
    console.log('[InventoryAPI] GET request - Total items in KV:', totalCards);
    
    // Get all inventory (format: "productId:printing" => quantity)
    const rawInventory = await getInventory();
    
    // Group by productId for easier consumption
    // Format: { "178894": { "Holofoil": 2, "Reverse Holofoil": 1 } }
    const groupedInventory: Record<string, Record<string, number>> = {};
    
    for (const [key, quantity] of Object.entries(rawInventory)) {
      if (quantity > 0) {
        // Parse "productId:printing" format
        const [productId, printing] = key.includes(':') 
          ? key.split(':') 
          : [key, 'Normal']; // Backward compatibility
        
        if (!groupedInventory[productId]) {
          groupedInventory[productId] = {};
        }
        
        groupedInventory[productId][printing] = quantity;
      }
    }
    
    if (idsParam) {
      // Return stock for specific IDs only
      const ids = idsParam.split(',').map(id => id.trim());
      const filteredInventory: Record<string, Record<string, number>> = {};
      
      ids.forEach(id => {
        if (groupedInventory[id]) {
          filteredInventory[id] = groupedInventory[id];
        }
      });
      
      console.log('[InventoryAPI] Requested IDs:', ids.length, 'Found in stock:', Object.keys(filteredInventory).length);
      
      return NextResponse.json({
        inventory: filteredInventory,
        totalCards: Object.keys(groupedInventory).length,
      });
    }
    
    // Return all inventory
    console.log('[InventoryAPI] Returning all inventory:', Object.keys(groupedInventory).length, 'unique products');
    
    return NextResponse.json({
      inventory: groupedInventory,
      totalCards: Object.keys(groupedInventory).length,
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
        // CSV format: TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity,Printing
        const columns = line.split(',');
        
        if (columns.length >= 8) {
          const tcgplayerId = columns[0].trim();
          const addToQuantity = parseInt(columns[7].trim()) || 0;
          const printing = columns[8]?.trim().toLowerCase() || 'normal'; // Column 8 = Printing
          
          if (tcgplayerId && addToQuantity > 0) {
            // Normalize printing names
            const normalizedPrinting = normalizePrinting(printing);
            
            // Create unique key: productId:printing
            const inventoryKey = `${tcgplayerId}:${normalizedPrinting}`;
            
            // Add or update inventory for this specific variant
            const currentQty = inventoryItems[inventoryKey] || 0;
            inventoryItems[inventoryKey] = currentQty + addToQuantity;
            processedCount++;
            
            console.log(`[InventoryAPI] Line ${index + 2}: ${tcgplayerId} (${normalizedPrinting}) = ${addToQuantity}`);
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
