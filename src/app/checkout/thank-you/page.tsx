'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircleIcon, EnvelopeIcon, PhoneIcon, UserIcon, MapPinIcon, IdentificationIcon } from '@heroicons/react/24/outline'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const orderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      console.log('[ThankYou] Fetching order details for:', orderId);
      // Fetch order details
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          console.log('[ThankYou] API response:', data);
          if (data.success) {
            setOrderDetails(data.order)
            console.log('[ThankYou] Order details set:', data.order);
          } else {
            console.error('[ThankYou] Failed to fetch order:', data.error);
          }
          setLoading(false)
        })
        .catch((error) => {
          console.error('[ThankYou] Error fetching order:', error);
          setLoading(false)
        })
    } else {
      console.log('[ThankYou] No orderId provided');
      setLoading(false)
    }
  }, [orderId])

  return (
    <div className="min-h-screen bg-gray-50 mt-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-8">
          {/* Success Icon */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="mt-6 text-3xl font-bold text-gray-900 font-thunder">
              ¡Pedido Recibido!
            </h1>
            
            {orderNumber && (
              <p className="mt-2 text-lg text-gray-600">
                Número de pedido: <span className="font-semibold text-gray-900">{orderNumber}</span>
              </p>
            )}
            
            <p className="mt-4 text-base text-gray-600 max-w-md mx-auto">
              Gracias por tu pedido. Hemos recibido tu solicitud exitosamente.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mt-8 text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando detalles del pedido...</p>
            </div>
          )}

          {/* No Order Details State */}
          {!loading && !orderDetails && orderId && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-sm text-yellow-800">
                No se pudieron cargar los detalles del pedido. Por favor contacta con soporte con tu número de pedido: <span className="font-semibold">{orderNumber}</span>
              </p>
            </div>
          )}

          {/* Order Details */}
          {!loading && orderDetails && (
            <div className="mt-8 border-t border-gray-200 pt-8 space-y-8">
              {/* Items List */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 font-interphases">Productos Comprados</h2>
                <div className="space-y-3">
                  {orderDetails.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 bg-gray-50 rounded-lg p-4">
                      {/* Card Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={item.imageUrl || '/placeholder-card.jpg'}
                          alt={item.cardName}
                          width={60}
                          height={84}
                          className="rounded object-cover"
                        />
                      </div>
                      
                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{item.cardName}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.setName}</p>
                        {item.printing && (
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">{item.printing}</p>
                        )}
                        {item.quantity && (
                          <p className="text-xs text-gray-600 mt-0.5">Cantidad: {item.quantity}</p>
                        )}
                        {item.rarity && (
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{item.rarity}</p>
                        )}
                        <div className="mt-2">
                          {item.inStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              En Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Por Encargo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          AR$ {item.priceArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {item.quantity && item.quantity > 1 && (
                          <p className="text-xs text-gray-500">x{item.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 font-interphases">Resumen del Pedido</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items totales:</span>
                    <span className="font-medium text-gray-900">{orderDetails.items.length}</span>
                  </div>
                  {orderDetails.itemsInStock > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">En stock:</span>
                      <span className="font-medium text-green-700">{orderDetails.itemsInStock}</span>
                    </div>
                  )}
                  {orderDetails.itemsToOrder > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">A encargo:</span>
                      <span className="font-medium text-yellow-700">{orderDetails.itemsToOrder}</span>
                    </div>
                  )}
                  
                  {/* Shipping Info */}
                  {orderDetails.shippingMethod && (
                    <div className="pt-3 border-t border-gray-300">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Método de Envío:</span>
                        <span className="font-medium text-gray-900">
                          {orderDetails.shippingMethod === 'pickup' ? '📍 Retiro por warehouse' : '🚚 Envío a domicilio'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo de Envío:</span>
                        <span className="font-medium text-gray-900">
                          {orderDetails.shippingCost && orderDetails.shippingCost > 0 
                            ? `AR$ ${orderDetails.shippingCost.toLocaleString('es-AR')}` 
                            : 'Gratis'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">AR$ {orderDetails.totalArs.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 font-interphases">Datos del Comprador</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {orderDetails.customer.firstName} {orderDetails.customer.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <IdentificationIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">DNI</p>
                      <p className="text-sm text-gray-900">{orderDetails.customer.dni}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-sm text-gray-900">{orderDetails.customer.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{orderDetails.customer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Dirección</p>
                      <p className="text-sm text-gray-900">{orderDetails.customer.address}</p>
                    </div>
                  </div>
                  
                  {/* Comments */}
                  {orderDetails.comments && (
                    <div className="pt-3 border-t border-gray-300">
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Comentarios</p>
                          <p className="text-sm text-gray-900 italic mt-1 p-3 bg-white rounded border border-gray-200">
                            &ldquo;{orderDetails.comments}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-base font-medium text-blue-900 mb-3">Próximos Pasos</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Nos contactaremos contigo al número de teléfono proporcionado</li>
              <li>Te enviaremos un link de pago o datos para transferencia bancaria</li>
              <li>Una vez recibido el pago, confirmaremos tu pedido</li>
              <li>Te notificaremos cuando tu pedido esté listo para envío/retiro</li>
            </ol>
          </div>

          {/* Important Notice */}
          {orderDetails && orderDetails.itemsToOrder > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Nota importante:</span> Tu pedido incluye {orderDetails.itemsToOrder} item{orderDetails.itemsToOrder !== 1 ? 's' : ''} que debe{orderDetails.itemsToOrder !== 1 ? 'n' : ''} ser pedido{orderDetails.itemsToOrder !== 1 ? 's' : ''} al proveedor. Te contactaremos para confirmar disponibilidad y tiempos de entrega.
              </p>
            </div>
          )}

          {/* WhatsApp Contact */}
          {!loading && orderDetails && (
            <div className="mt-8 bg-green-50 border-2 border-green-400 rounded-lg p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <h3 className="text-xl font-bold text-green-900">Contactanos por WhatsApp</h3>
              </div>
              <p className="text-center text-sm text-green-800 mb-4">
                Envianos un mensaje con tu número de pedido para coordinar el pago y la entrega
              </p>
              <div className="flex justify-center">
                <a
                  href={`https://wa.me/5491131160311?text=${encodeURIComponent(
                    `Hola! Acabo de hacer un pedido:\n\n` +
                    `📋 *Pedido #${orderNumber}*\n\n` +
                    `*Productos:*\n` +
                    orderDetails.items.map((item: any, i: number) => 
                      `${i + 1}. ${item.cardName} - ${item.inStock ? '✅ En Stock' : '⏱ Por Encargo'} - AR$ ${item.priceArs.toLocaleString('es-AR')}`
                    ).join('\n') +
                    `\n\n*Total: AR$ ${orderDetails.totalArs.toLocaleString('es-AR')}*\n\n` +
                    `*Mis datos:*\n` +
                    `Nombre: ${orderDetails.customer.firstName} ${orderDetails.customer.lastName}\n` +
                    `DNI: ${orderDetails.customer.dni}\n` +
                    `Teléfono: ${orderDetails.customer.phone}\n` +
                    `Email: ${orderDetails.customer.email}\n` +
                    `Dirección: ${orderDetails.customer.address}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Abrir WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/cards"
              className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
            >
              Seguir Comprando
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 text-center"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-32">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}

