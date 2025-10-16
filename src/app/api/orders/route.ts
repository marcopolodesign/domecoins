import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getAllOrders } from '@/lib/kv';

// GET all orders
export async function GET() {
  try {
    const orders = await getAllOrders();
    
    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { customer, items, itemsInStock, itemsToOrder, totalArs, totalUsd } = body;
    
    if (!customer || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create order
    const order = await createOrder({
      status: 'pending',
      customer,
      items,
      itemsInStock: itemsInStock || 0,
      itemsToOrder: itemsToOrder || 0,
      totalArs,
      totalUsd,
      paymentMethod: null,
      paymentLink: null,
      paymentStatus: 'pending',
    });
    
    return NextResponse.json({
      success: true,
      order,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

