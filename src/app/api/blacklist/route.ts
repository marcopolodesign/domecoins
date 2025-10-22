import { NextRequest, NextResponse } from 'next/server';
import { setBlacklistCards, getBlacklistCards } from '@/lib/kv';

/**
 * GET /api/blacklist
 * Retrieve blacklisted card IDs
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[BlacklistAPI] GET request - fetching blacklisted cards');
    
    const productIds = await getBlacklistCards();
    const totalCards = productIds.length;
    
    console.log(`[BlacklistAPI] Retrieved ${totalCards} blacklisted cards`);
    
    return NextResponse.json({
      productIds,
      totalCards,
      message: `Found ${totalCards} blacklisted cards`
    });
  } catch (error: any) {
    console.error('[BlacklistAPI] Error fetching blacklisted cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklisted cards', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blacklist
 * Upload CSV and store blacklisted card IDs
 * 
 * Expected CSV format:
 * TCGplayer Id,Product Line,Set Name,Product Name
 * 94167,Pokemon,XY - Phantom Forces,Gengar EX
 * ...
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[BlacklistAPI] POST request - uploading blacklist CSV');
    
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

    // Extract TCGplayer IDs (first column)
    const productIds: string[] = [];
    
    // Skip header (first line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma (simple parsing)
      const columns = line.split(',');
      
      if (columns.length > 0) {
        const tcgplayerId = columns[0].trim();
        
        // Validate it's a number
        if (tcgplayerId && !isNaN(parseInt(tcgplayerId, 10))) {
          productIds.push(tcgplayerId);
        } else {
          console.warn(`[BlacklistAPI] Skipping invalid TCGplayer Id: ${tcgplayerId}`);
        }
      }
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid TCGplayer IDs found in CSV' },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueProductIds = Array.from(new Set(productIds));
    
    console.log(`[BlacklistAPI] Parsed ${uniqueProductIds.length} unique product IDs from CSV`);
    console.log(`[BlacklistAPI] Sample IDs:`, uniqueProductIds.slice(0, 5));

    // Store in KV
    await setBlacklistCards(uniqueProductIds);

    return NextResponse.json({
      success: true,
      count: uniqueProductIds.length,
      message: `Successfully uploaded ${uniqueProductIds.length} blacklisted cards`
    });

  } catch (error: any) {
    console.error('[BlacklistAPI] Error uploading blacklist:', error);
    return NextResponse.json(
      { error: 'Failed to upload blacklist', details: error.message },
      { status: 500 }
    );
  }
}

