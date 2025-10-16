import { NextRequest, NextResponse } from 'next/server';

// In-memory inventory storage
// Key: TCGplayer Id, Value: quantity
let inventoryCache: Map<string, number> = new Map();

// Get inventory for specific card IDs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids'); // Comma-separated IDs
    
    if (idsParam) {
      // Return stock for specific IDs
      const ids = idsParam.split(',').map(id => id.trim());
      const result: Record<string, number> = {};
      
      ids.forEach(id => {
        result[id] = inventoryCache.get(id) || 0;
      });
      
      return NextResponse.json({
        inventory: result,
        totalCards: inventoryCache.size,
      });
    }
    
    // Return all inventory
    const allInventory: Record<string, number> = {};
    inventoryCache.forEach((quantity, id) => {
      allInventory[id] = quantity;
    });
    
    return NextResponse.json({
      inventory: allInventory,
      totalCards: inventoryCache.size,
    });

  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    );
  }
}

// Upload CSV inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvData } = body;

    if (!csvData || typeof csvData !== 'string') {
      return NextResponse.json(
        { error: 'Invalid CSV data provided' },
        { status: 400 }
      );
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Skip header row
    const header = lines[0];
    const dataLines = lines.slice(1);
    
    // Clear existing inventory
    inventoryCache.clear();
    
    let processedCount = 0;
    let errorCount = 0;
    
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
            const currentQty = inventoryCache.get(tcgplayerId) || 0;
            inventoryCache.set(tcgplayerId, currentQty + addToQuantity);
            processedCount++;
          }
        }
      } catch (err) {
        errorCount++;
        console.error(`Error parsing line ${index + 2}:`, err);
      }
    });

    return NextResponse.json({
      success: true,
      processedCount,
      errorCount,
      totalCards: inventoryCache.size,
      updatedAt: new Date().toISOString(),
      note: 'Inventory stored in memory. Will reset on redeployment.',
    });

  } catch (error: any) {
    console.error('Error uploading inventory:', error);
    return NextResponse.json(
      { error: 'Failed to upload inventory', details: error.message },
      { status: 500 }
    );
  }
}

// Clear inventory
export async function DELETE(request: NextRequest) {
  try {
    const previousSize = inventoryCache.size;
    inventoryCache.clear();

    return NextResponse.json({
      success: true,
      message: `Cleared ${previousSize} items from inventory`,
    });

  } catch (error: any) {
    console.error('Error clearing inventory:', error);
    return NextResponse.json(
      { error: 'Failed to clear inventory', details: error.message },
      { status: 500 }
    );
  }
}

