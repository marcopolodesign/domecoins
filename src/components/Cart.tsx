'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { closeCart, removeFromCart, updateQuantity } from '@/store/cartSlice'
import Image from 'next/image'
import Link from 'next/link'

export default function Cart() {
  const dispatch = useDispatch()
  const { items, isOpen, total } = useSelector((state: RootState) => state.cart)

  const handleClose = () => {
    dispatch(closeCart())
  }

  const handleRemoveItem = (cardId: string) => {
    dispatch(removeFromCart(cardId))
  }

  const handleUpdateQuantity = (cardId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemoveItem(cardId)
    } else {
      dispatch(updateQuantity({ cardId, quantity: newQuantity }))
    }
  }

  const handleCheckout = () => {
    // TODO: Implement MercadoPago checkout
    console.log('Proceeding to checkout...')
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Carrito de Compras
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={handleClose}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Cerrar panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Cart items */}
                      <div className="mt-8">
                        <div className="flow-root">
                          {items.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              </div>
                              <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                              <Link
                                href="/cards"
                                className="btn btn-primary"
                                onClick={handleClose}
                              >
                                Explorar Cartas
                              </Link>
                            </div>
                          ) : (
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {items.map((item) => (
                                <li key={item.card.id} className="flex py-6">
                                  <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={item.card.images.small}
                                      alt={item.card.name}
                                      width={64}
                                      height={96}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link href={`/cards/${item.card.id}`} onClick={handleClose}>
                                            {item.card.name}
                                          </Link>
                                        </h3>
                                        <div className="ml-4 text-right">
                                          <p className="text-sm text-gray-500">
                                            US${item.priceUsd.toFixed(2)}
                                          </p>
                                          <p className="font-medium">
                                            AR${item.priceArs.toLocaleString('es-AR')}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {item.card.set.name} #{item.card.number}
                                      </p>
                                      {item.card.rarity && (
                                        <p className="text-xs text-gray-400 capitalize">
                                          {item.card.rarity}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleUpdateQuantity(item.card.id, item.quantity - 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                          disabled={item.quantity <= 1}
                                        >
                                          <MinusIcon className="h-4 w-4 text-gray-400" />
                                        </button>
                                        <span className="text-gray-500 min-w-[2rem] text-center">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleUpdateQuantity(item.card.id, item.quantity + 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                        >
                                          <PlusIcon className="h-4 w-4 text-gray-400" />
                                        </button>
                                      </div>

                                      <div className="flex">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveItem(item.card.id)}
                                          className="p-1 text-red-600 hover:text-red-500 transition-colors"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer with totals and checkout */}
                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="space-y-4">
                          {/* Subtotal */}
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <p>Subtotal</p>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                US${total.usd.toFixed(2)}
                              </p>
                              <p>AR${total.ars.toLocaleString('es-AR')}</p>
                            </div>
                          </div>
                          
                          {/* Shipping notice */}
                          <p className="text-sm text-gray-500">
                            Envío calculado en el checkout
                          </p>

                          {/* Checkout button */}
                          <div className="mt-6">
                            <button
                              onClick={handleCheckout}
                              className="w-full btn btn-primary btn-lg"
                            >
                              Proceder al Pago
                            </button>
                          </div>

                          {/* Continue shopping */}
                          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                            <p>
                              o{' '}
                              <Link
                                href="/cards"
                                className="font-medium text-primary-600 hover:text-primary-500"
                                onClick={handleClose}
                              >
                                Continuar Comprando
                                <span aria-hidden="true"> &rarr;</span>
                              </Link>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
