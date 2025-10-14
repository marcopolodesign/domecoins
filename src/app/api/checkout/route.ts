import { NextRequest, NextResponse } from 'next/server'
// import { MercadoPagoConfig, Preference } from 'mercadopago'

// Note: Uncomment and configure when you have MercadoPago credentials
// const client = new MercadoPagoConfig({ 
//   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
// })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, shipping } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    if (!customer || !customer.email) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      )
    }

    // For now, return a mock response since MercadoPago needs real credentials
    // Replace this with actual MercadoPago integration:
    
    /*
    const preference = new Preference(client)
    
    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        currency_id: 'ARS',
        unit_price: item.unit_price,
      })),
      payer: {
        email: customer.email,
        name: customer.name,
        surname: customer.surname,
        phone: customer.phone ? {
          area_code: customer.phone.area_code,
          number: customer.phone.number,
        } : undefined,
        identification: customer.identification ? {
          type: customer.identification.type,
          number: customer.identification.number,
        } : undefined,
      },
      shipments: shipping ? {
        cost: shipping.cost,
        mode: 'not_specified',
        receiver_address: {
          street_name: shipping.address.street_name,
          street_number: shipping.address.street_number,
          zip_code: shipping.address.zip_code,
          city_name: shipping.address.city_name,
          state_name: shipping.address.state_name,
          country_name: 'Argentina',
        },
      } : undefined,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`,
      },
      auto_return: 'approved',
      external_reference: `order_${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'POKEMON TCG ARG',
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    }

    const response = await preference.create({ body: preferenceData })
    
    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    })
    */

    // Mock response for development
    const mockPreferenceId = `mock_${Date.now()}`
    const mockInitPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`

    return NextResponse.json({
      id: mockPreferenceId,
      init_point: mockInitPoint,
      sandbox_init_point: mockInitPoint,
      message: 'Mock checkout created - configure MercadoPago credentials for production',
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
