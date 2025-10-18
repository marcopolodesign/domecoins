import { NextRequest, NextResponse } from 'next/server';
import { setFeaturedCards, getFeaturedCards, getFeaturedCardsCount } from '@/lib/kv';

/**
 * GET /api/featured-cards
 * Retrieve featured card IDs for homepage carousels
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[FeaturedCardsAPI] GET request - fetching featured cards');
    
    const productIds = await getFeaturedCards();
    const totalCards = productIds.length;
    
    console.log(`[FeaturedCardsAPI] Retrieved ${totalCards} featured cards`);
    
    return NextResponse.json({
      productIds,
      totalCards,
      message: `Found ${totalCards} featured cards`
    });
  } catch (error: any) {
    console.error('[FeaturedCardsAPI] Error fetching featured cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured cards', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/featured-cards
 * Upload CSV and store featured card IDs
 * 
 * Expected CSV format:
 * TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity
 * 94167,Pokemon,XY - Phantom Forces,Gengar EX,,34/119,,1
 * ...
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[FeaturedCardsAPI] POST request - uploading featured cards CSV');
    
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
      
      // Split by comma (simple parsing, assumes no commas in quoted fields for TCGplayer Id)
      const columns = line.split(',');
      
      if (columns.length > 0) {
        const tcgplayerId = columns[0].trim();
        
        // Validate it's a number
        if (tcgplayerId && !isNaN(parseInt(tcgplayerId, 10))) {
          productIds.push(tcgplayerId);
        } else {
          console.warn(`[FeaturedCardsAPI] Skipping invalid TCGplayer Id: ${tcgplayerId}`);
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
    
    console.log(`[FeaturedCardsAPI] Parsed ${uniqueProductIds.length} unique product IDs from CSV`);
    console.log(`[FeaturedCardsAPI] Sample IDs:`, uniqueProductIds.slice(0, 5));

    // Store in KV
    await setFeaturedCards(uniqueProductIds);

    return NextResponse.json({
      success: true,
      count: uniqueProductIds.length,
      message: `Successfully uploaded ${uniqueProductIds.length} featured cards`
    });

  } catch (error: any) {
    console.error('[FeaturedCardsAPI] Error uploading featured cards:', error);
    return NextResponse.json(
      { error: 'Failed to upload featured cards', details: error.message },
      { status: 500 }
    );
  }
}

