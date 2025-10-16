import { NextRequest, NextResponse } from 'next/server';
import { searchTCGPlayerPrices } from '@/lib/tcgplayer-price-scraper';

/**
 * Test endpoint to discover TCGPlayer API limits
 * 
 * Tests various page sizes to find the maximum allowed
 * Usage: GET /api/test-tcgplayer-limits?query=pikachu&testSizes=20,40,60,100,250
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'pikachu';
    const testSizesParam = searchParams.get('testSizes') || '20,40,60,100,250';
    const testSizes = testSizesParam.split(',').map(s => parseInt(s.trim()));
    
    console.log(`[TCGPlayer Limits Test] Testing query: "${query}" with sizes: ${testSizes.join(', ')}`);

    const results: Array<{
      pageSize: number;
      status: 'success' | 'error';
      resultsReturned?: number;
      totalAvailable?: number;
      error?: string;
      responseTime?: number;
    }> = [];

    for (const pageSize of testSizes) {
      const startTime = Date.now();
      
      try {
        console.log(`\n[TCGPlayer Limits Test] Testing pageSize: ${pageSize}`);
        
        const cards = await searchTCGPlayerPrices(query, {
          pageSize,
          page: 1,
        });
        
        const responseTime = Date.now() - startTime;
        
        const result = {
          pageSize,
          status: 'success' as const,
          resultsReturned: cards.length,
          totalAvailable: cards.length, // TCGPlayer returns all available results
          responseTime,
        };
        
        results.push(result);
        
        console.log(`[TCGPlayer Limits Test] ✓ pageSize ${pageSize}: ${cards.length} cards in ${responseTime}ms`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        
        const result = {
          pageSize,
          status: 'error' as const,
          error: error.message,
          responseTime,
        };
        
        results.push(result);
        
        console.error(`[TCGPlayer Limits Test] ✗ pageSize ${pageSize}: ${error.message}`);
      }
    }

    // Analyze results to find the effective limit
    const successfulTests = results.filter(r => r.status === 'success');
    const maxSuccessfulSize = successfulTests.length > 0 
      ? Math.max(...successfulTests.map(r => r.pageSize))
      : 0;
    
    const analysis = {
      query,
      testedSizes: testSizes,
      maxSuccessfulPageSize: maxSuccessfulSize,
      results,
      recommendation: maxSuccessfulSize >= 100 
        ? `TCGPlayer supports page sizes up to at least ${maxSuccessfulSize}. Consider using ${maxSuccessfulSize} for better UX.`
        : maxSuccessfulSize > 0
        ? `TCGPlayer has a limit around ${maxSuccessfulSize}. Use smaller page sizes.`
        : 'All tests failed. TCGPlayer API may be unavailable or rate limiting.',
      avgResponseTime: successfulTests.length > 0
        ? Math.round(successfulTests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successfulTests.length)
        : null,
    };

    console.log('\n[TCGPlayer Limits Test] ========== SUMMARY ==========');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('[TCGPlayer Limits Test] ============================\n');

    return NextResponse.json(analysis, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      }
    });
    
  } catch (error: any) {
    console.error('[TCGPlayer Limits Test] Fatal error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

