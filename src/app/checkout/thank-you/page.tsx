'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const orderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      // Fetch order details
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrderDetails(data.order)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
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

          {/* Order Details */}
          {!loading && orderDetails && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h2>
              
              <div className="space-y-4">
                {/* Items Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items totales:</span>
                    <span className="font-medium text-gray-900">{orderDetails.items.length}</span>
                  </div>
                  {orderDetails.itemsInStock > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">En stock:</span>
                      <span className="font-medium text-green-700">{orderDetails.itemsInStock}</span>
                    </div>
                  )}
                  {orderDetails.itemsToOrder > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">A encargo:</span>
                      <span className="font-medium text-yellow-700">{orderDetails.itemsToOrder}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">AR${orderDetails.totalArs.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Datos de Contacto</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{orderDetails.customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{orderDetails.customer.email}</span>
                    </div>
                  </div>
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

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/cards"
              className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Seguir Comprando
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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

