import { NextResponse } from 'next/server';
import { getOrderStats } from '@/lib/kv';

// GET order statistics
export async function GET() {
  try {
    const stats = await getOrderStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order statistics' },
      { status: 500 }
    );
  }
}

