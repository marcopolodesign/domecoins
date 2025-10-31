import { NextRequest, NextResponse } from 'next/server';
import { setAccessories, getAccessories, type Accessory } from '@/lib/kv';

/**
 * GET /api/accessories
 * Retrieve all accessories
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[AccessoriesAPI] GET request - fetching accessories');
    
    const accessories = await getAccessories();
    const totalItems = accessories.length;
    
    console.log(`[AccessoriesAPI] Retrieved ${totalItems} accessories`);
    
    return NextResponse.json({
      accessories,
      totalItems,
      message: `Found ${totalItems} accessories`
    });
  } catch (error: any) {
    console.error('[AccessoriesAPI] Error fetching accessories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessories', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accessories
 * Upload CSV and store accessories data
 * 
 * Expected CSV format (comma or semicolon-separated):
 * TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity,Img,Price
 * AC0001,Accesorio,Folio,ETB Lucario,,65,,7,https://...,5.99
 * ...
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[AccessoriesAPI] POST request - uploading accessories CSV');
    
    const csvContent = await request.text();
    
    if (!csvContent || csvContent.trim() === '') {
      return NextResponse.json(
        { error: 'CSV content is empty' },
        { status: 400 }
      );
    }

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must contain at least a header and one data row' },
        { status: 400 }
      );
    }

    // Auto-detect separator (comma or semicolon) from header
    const header = lines[0];
    const separator = header.includes(';') ? ';' : ',';
    console.log(`[AccessoriesAPI] Detected separator: "${separator}"`);

    const accessories: Accessory[] = [];
    
    // Skip header (first line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by detected separator
      const columns = line.split(separator);
      
      if (columns.length >= 9) {
        const id = columns[0].trim();
        const productLine = columns[1].trim();
        const setName = columns[2].trim();
        const productName = columns[3].trim();
        const title = columns[4].trim();
        const number = columns[5].trim();
        const totalQuantity = parseInt(columns[6].trim()) || 0;
        const addToQuantity = parseInt(columns[7].trim()) || 0;
        const imageUrl = columns[8].trim();
        const price = columns[9] ? parseFloat(columns[9].trim()) : undefined;
        
        if (id && productName) {
          accessories.push({
            id,
            productLine,
            setName,
            productName,
            title,
            number,
            totalQuantity,
            addToQuantity,
            imageUrl,
            price
          });
        } else {
          console.warn(`[AccessoriesAPI] Skipping invalid row: ${line}`);
        }
      }
    }

    if (accessories.length === 0) {
      return NextResponse.json(
        { error: 'No valid accessories found in CSV' },
        { status: 400 }
      );
    }

    console.log(`[AccessoriesAPI] Parsed ${accessories.length} accessories from CSV`);
    console.log(`[AccessoriesAPI] Sample accessories:`, accessories.slice(0, 3));

    // Store in KV
    await setAccessories(accessories);

    return NextResponse.json({
      success: true,
      count: accessories.length,
      message: `Successfully uploaded ${accessories.length} accessories`
    });

  } catch (error: any) {
    console.error('[AccessoriesAPI] Error uploading accessories:', error);
    return NextResponse.json(
      { error: 'Failed to upload accessories', details: error.message },
      { status: 500 }
    );
  }
}

