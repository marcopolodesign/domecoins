'use client'

import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Disclosure, Dialog, Transition } from '@headlessui/react'
import { 
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { RootState } from '@/store'
import { toggleCart } from '@/store/cartSlice'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SearchBox from './SearchBox'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const navigation = [
  { name: 'Cartas', href: '/cards?inStock=true' },
  // { name: 'Accesorios', href: '/rarezas' },
  // { name: 'Sellados', href: '/rarezas' },
]

// Custom Pokedex/Card icon with badge
function PokedexIcon({ count }: { count: number }) {
  return (
    <div className="relative mr-3">
        <svg width="25" height="36" viewBox="0 0 25 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="22.9001" height="33.8664" rx="2.25" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="6.65021" cy="6.64297" r="2.68036" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="18.7425" cy="4.62003" r="1.40741" fill="currentColor"/>
      <path d="M0.612061 14.3959C2.71727 14.3959 7.43979 14.3959 9.48816 14.3959C12.0486 14.3959 12.4754 8.84828 16.2306 8.84828C19.2349 8.84828 22.6032 8.84828 23.9119 8.84828" stroke="currentColor" stroke-width="1.5"/>
      <path d="M2.83105 21.8211L4.32471 23.3147L2.83105 24.8083" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7.55676 30.866H16.8433" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>

      {count > 0 && (
        <span className="absolute -top-1 -right-3 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  )
}

export default function Header() {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const cartTotal = useSelector((state: RootState) => state.cart.total)
  const headerRef = useRef<HTMLDivElement>(null)
  const noticesRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  
  const isHomePage = pathname === '/'
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // GSAP scroll animation for header
  useEffect(() => {
    if (headerRef.current && noticesRef.current) {
      const header = headerRef.current
      const notices = noticesRef.current
      
      // Set initial position immediately to prevent flash
      gsap.set(header, { y: 0 })
      gsap.set(notices, { y: 0 })
      
      // Create scroll trigger for header animations
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const scrollY = self.scroll()
          
          // Only change isScrolled state, keep notices and header fixed
          if (scrollY > 50) {
            setIsScrolled(true)
          } else {
            setIsScrolled(false)
          }
        }
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [isHomePage])

  const handleCartClick = () => {
    dispatch(toggleCart())
  }

  // Listen for cart toggle events from footer
  useEffect(() => {
    const handleToggleCart = () => {
      dispatch(toggleCart())
    }

    window.addEventListener('toggleCart', handleToggleCart)
    
    return () => {
      window.removeEventListener('toggleCart', handleToggleCart)
    }
  }, [dispatch])

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Notices Section */}
      <div 
        ref={noticesRef}
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white relative"
      >
        <div className="container-custom py-3">
          <div className="flex items-center justify-center text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2 animate-pulse" />
            <span className="font-medium">
              ¡Compramos tus cartas! 
              <a 
                href="https://wa.me/5491131160311" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-1 underline hover:text-white/80 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                Consultanos por WhatsApp
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <Disclosure as="nav" ref={headerRef} className={`
        transition-all duration-300 ease-out rounded-br-2xl rounded-bl-2xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
        ${(isHomePage && !isScrolled && !open) 
          ? 'bg-transparent' 
          : 'bg-white/70 backdrop-blur-md border-b border-gray-200'
        }
      `}>
        {({ open }) => {
          // Determine text colors based on page, scroll state, and menu state
          const textColor = (isHomePage && !isScrolled && !open) ? 'text-white' : 'text-gray-900'
          const logoTextColor = (isHomePage && !isScrolled && !open) ? 'text-white' : 'text-gray-900'
          const hoverColor = (isHomePage && !isScrolled && !open) ? 'hover:text-white/80' : 'hover:text-blue-600'

          return (
          <>
            <div className="">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="h-10 w-10 border-2 border-[`${logoTextColor}`] rounded-full flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        className={`h-6 w-6 ${logoTextColor} ${hoverColor}`}
                      >
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="4" className={logoTextColor} fill="currentColor "/>
                        <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <span className={`text-4xl font-thunder uppercase font-ultra leading-[1] block mt-1 ${logoTextColor}`}>
                        DomeTCG
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Center: SearchBox (shown when scrolled on home, or always on other pages) */}
                {(!isHomePage || isScrolled) && (
                  <div className="hidden md:block flex-1 max-w-2xl mx-8">
                    <SearchBox variant="header" />
                  </div>
                )}

                {/* Right side: Navigation, Cart, Search */}
                <div className="flex items-center space-x-4 md:space-x-6">
                  {/* Navigation links - always visible on desktop */}
                  <div className="hidden md:flex items-center space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${textColor} ${hoverColor} text-sm font-medium transition-colors duration-200`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Search Button */}
                  <button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className={`md:hidden ${textColor} ${hoverColor} transition-colors duration-200`}
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </button>
                    
                  {/* Cart with total (hide price on mobile) */}
                  <button
                    onClick={handleCartClick}
                    className={`flex items-center space-x-2 ${textColor} ${hoverColor} transition-colors duration-200`}
                  >
                    <PokedexIcon count={totalItems} />
                    <span className="hidden md:inline text-lg font-semibold">
                      ${cartTotal.ars.toFixed(2)}
                    </span>
                  </button>

                  {/* Mobile menu button */}
                  <Disclosure.Button className={`md:hidden inline-flex items-center justify-center p-2 rounded-md ${textColor} hover:opacity-70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <Disclosure.Panel className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {/* Mobile search for non-home pages */}
                {!isHomePage && (
                  <div className="px-3 py-2">
                    <SearchBox variant="header" />
                  </div>
                )}

                {/* Mobile navigation links */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${textColor} hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </Disclosure.Panel>
          </>
          )
        }}
      </Disclosure>

      {/* Mobile Search Modal */}
      <Transition.Root show={isMobileSearchOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsMobileSearchOpen}>
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
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-y-full"
                  enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-y-0"
                  leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-full">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
                        <Dialog.Title className="text-2xl font-medium text-gray-900">
                          Buscar Cartas
                        </Dialog.Title>
                        <button
                          type="button"
                          className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={() => setIsMobileSearchOpen(false)}
                        >
                          <span className="absolute -inset-0.5" />
                          <span className="sr-only">Cerrar panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Search Box */}
                      <div className="flex-1 px-4 py-6">
                        <SearchBox 
                          variant="header" 
                          placeholder="Buscar cartas..." 
                          onSearch={() => {
                            setIsMobileSearchOpen(false)
                            // Navigation is handled by SearchBox
                          }}
                        />
                        
                        {/* Search Tips */}
                        <div className="mt-8">
                          <h3 className="text-sm font-medium text-gray-900 mb-4">Sugerencias:</h3>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                window.location.href = '/cards?search=Pikachu'
                                setIsMobileSearchOpen(false)
                              }}
                              className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-900">Pikachu</p>
                            </button>
                            <button
                              onClick={() => {
                                window.location.href = '/cards?search=Charizard'
                                setIsMobileSearchOpen(false)
                              }}
                              className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-900">Charizard</p>
                            </button>
                            <button
                              onClick={() => {
                                window.location.href = '/cards?inStock=true'
                                setIsMobileSearchOpen(false)
                              }}
                              className="block w-full text-left px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-green-900">📦 Ver Cartas en Stock</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}
