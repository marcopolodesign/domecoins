'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { clearCart } from '@/store/cartSlice'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline'

export default function CheckoutPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { items, total } = useSelector((state: RootState) => state.cart)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
    address: '',
    comments: '',
    shipping: 'pickup', // 'pickup' or 'delivery'
  })

  // Calculate stock separation
  const itemsInStock = items.filter(item => item.inStock).length
  const itemsToOrder = items.filter(item => !item.inStock).length

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }
  
  // Calculate shipping cost
  const SHIPPING_COST = 15000
  const shippingCost = formData.shipping === 'delivery' ? SHIPPING_COST : 0
  const totalWithShipping = total.ars + shippingCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.dni || !formData.phone || !formData.email || !formData.address) {
        toast.error('Por favor completa todos los campos')
        setIsSubmitting(false)
        return
      }

      // Create order
      const orderData = {
        customer: formData,
        items: items.map(item => ({
          cardId: item.card.id,
          cardName: item.card.name,
          imageUrl: (item.card as any).imageUrl || (item.card as any).images?.large || (item.card as any).images?.small || '/placeholder-card.svg',
          setName: (item.card as any).categoryName || (item.card as any).set?.name || 'Unknown Set',
          rarity: (item.card as any).rarity || 'Unknown',
          printing: (item.card as any).printing || 'Normal',
          quantity: item.quantity,
          priceUsd: item.priceUsd,
          priceArs: item.priceArs,
          inStock: item.inStock,
        })),
        itemsInStock,
        itemsToOrder,
        totalArs: totalWithShipping,
        totalUsd: total.usd,
        shippingMethod: formData.shipping,
        shippingCost: shippingCost,
        comments: formData.comments,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        // Clear cart
        dispatch(clearCart())
        
        // Redirect to thank you page
        router.push(`/checkout/thank-you?orderId=${result.order.id}&orderNumber=${result.order.orderNumber}`)
      } else {
        toast.error('Error al crear el pedido. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Error al procesar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-32">
        <div className="text-center">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay items en tu carrito</h3>
          <p className="mt-1 text-sm text-gray-500">Agrega algunos productos para continuar con el checkout</p>
          <div className="mt-6">
            <Link
              href="/cards"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 font-thunder">Checkout</h1>
            <p className="mt-2 text-sm text-gray-600">
              Completa tus datos para confirmar tu pedido
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="dni" className="block text-sm font-medium text-gray-700">
                    DNI *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    id="dni"
                    required
                    value={formData.dni}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+54 9 11 1234-5678"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección *
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Shipping Method */}
                <div className="sm:col-span-2">
                  <label htmlFor="shipping" className="block text-sm font-medium text-gray-700">
                    Método de Envío *
                  </label>
                  <select
                    name="shipping"
                    id="shipping"
                    required
                    value={formData.shipping}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="pickup">Retiro por warehouse - Gratis</option>
                    <option value="delivery">Envío a domicilio - AR$ {SHIPPING_COST.toLocaleString('es-AR')}</option>
                  </select>
                  
                  {/* Shipping Info */}
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.shipping === 'pickup' ? (
                      <span>📍 Retiro por zona de Puerto Madero</span>
                    ) : (
                      <span>🚚 Despachamos Envíos de 24 a 48hs una vez recibido el pago del pedido</span>
                    )}
                  </p>
                </div>

                {/* Comments */}
                <div className="sm:col-span-2">
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                    Comentarios (Opcional)
                  </label>
                  <textarea
                    name="comments"
                    id="comments"
                    rows={3}
                    value={formData.comments}
                    onChange={handleInputChange}
                    placeholder="Dejanos un comentario sobre tu pedido..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h2>
              
              {/* Stock Status Summary */}
              {(itemsInStock > 0 || itemsToOrder > 0) && (
                <div className="mb-6 space-y-2">
                  {itemsInStock > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">{itemsInStock} item{itemsInStock !== 1 ? 's' : ''} en stock</span>
                      <span className="text-gray-600">- Disponible para envío inmediato</span>
                    </div>
                  )}
                  {itemsToOrder > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <TruckIcon className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700">{itemsToOrder} item{itemsToOrder !== 1 ? 's' : ''} a encargo</span>
                      <span className="text-gray-600">- Se pedirán al proveedor</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const imageUrl = (item.card as any).imageUrl || (item.card as any).images?.large || (item.card as any).images?.small || '/placeholder-card.svg'
                  const setName = (item.card as any).categoryName || (item.card as any).set?.name || 'Unknown Set'
                  const printing = (item.card as any).printing
                  const itemTotal = item.priceArs * item.quantity
                  
                  return (
                    <div key={item.card.id} className="py-4 flex items-center gap-4">
                      <div className="flex-shrink-0 h-16 w-12 relative">
                        <Image
                          src={imageUrl}
                          alt={item.card.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.card.name}</p>
                        <p className="text-xs text-gray-500">{setName}</p>
                        {printing && (
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">{printing}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-0.5">Cantidad: {item.quantity}</p>
                        {!item.inStock && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            A encargo
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          AR$ {itemTotal.toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${item.priceArs.toLocaleString('es-AR')} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Subtotal and Shipping */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Subtotal</p>
                  <p>AR$ {total.ars.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Envío</p>
                  <p>{shippingCost === 0 ? 'Gratis' : `AR$ ${shippingCost.toLocaleString('es-AR')}`}</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
                  <p>Total</p>
                  <p>AR$ {totalWithShipping.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Información de Pago</h3>
              <p className="text-sm text-blue-700">
                Al confirmar tu pedido, nos contactaremos al número de teléfono proporcionado. 
                Te enviaremos un link de pago o los datos para realizar una transferencia bancaria. 
                Tu pedido será confirmado una vez que recibamos el pago.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/cards"
                className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Seguir Comprando
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


