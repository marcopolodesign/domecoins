'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/lib/kv'
import {
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando órdenes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-700">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-700">Pagadas</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.paid}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-700">Revenue</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              AR${stats.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Todas ({orders.length})
        </button>
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = orders.filter(o => o.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay órdenes {filter !== 'all' ? `con estado "${STATUS_LABELS[filter as keyof typeof STATUS_LABELS]}"` : ''}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.customer.firstName} {order.customer.lastName} • {order.customer.phone}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          AR${order.totalArs.toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500">{order.items.length} items</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Customer Details */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Información del Cliente</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">DNI:</span> <span className="text-gray-900">{order.customer.dni}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span> <span className="text-gray-900">{order.customer.email}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Dirección:</span> <span className="text-gray-900">{order.customer.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.cardName}</p>
                              <p className="text-gray-600 text-xs">{item.setName}</p>
                              {!item.inStock && (
                                <span className="inline-block mt-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                                  A encargo
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">AR${item.priceArs.toLocaleString('es-AR')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="mb-4 p-3 bg-white rounded">
                      <div className="flex gap-4 text-sm">
                        {order.itemsInStock > 0 && (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="text-gray-700">{order.itemsInStock} en stock</span>
                          </div>
                        )}
                        {order.itemsToOrder > 0 && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-yellow-600" />
                            <span className="text-gray-700">{order.itemsToOrder} a encargo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Actualizar Estado</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_LABELS).map(([status, label]) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            disabled={order.status === status}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                              order.status === status
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

