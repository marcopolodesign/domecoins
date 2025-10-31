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
  { name: 'Accesorios', href: '/accessories' },
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
                    <div className="w-32 h-full mb-3">
                      <svg
                        viewBox="0 0 3000 942"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="block mt-1"
                      >
                        <path 
                          d="M712.04 236.73L711.51 941.5L1285.85 941.93L1375.16 848.18L1375.69 145.7L803.63 145.27L712.03 236.73H712.04ZM1025.5 273.58L1064.4 273.61L1064 806.77L1025.1 806.74L1025.5 273.58Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M3000 391.47V147.07H2826.19C2801.77 178.9 2779.44 200.82 2737.43 204.06L2477.13 203.98L2442.67 238.44V941.95H2999.99V692.98H2764.73V656.43H2999.99V432.59H2764.73V391.48H2999.99L3000 391.47Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M2317.1 30.74H2362.09V150.63H2397.2V30.74H2442.18V2.01001H2317.1V30.74Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M2500.35 143.75C2510.96 149.67 2522.94 152.63 2536.31 152.63C2546.42 152.63 2555.39 151.07 2563.24 147.94C2571.08 144.81 2577.79 140.61 2583.34 135.32C2588.89 130.03 2593.23 124.18 2596.36 117.76C2599.48 111.34 2601.38 104.81 2602.05 98.16H2566.44C2565.84 101.82 2564.71 105.09 2563.05 107.99C2561.39 110.88 2559.29 113.36 2556.77 115.42C2554.24 117.48 2551.32 119.05 2547.99 120.11C2544.66 121.18 2541.01 121.71 2537.02 121.71C2529.9 121.71 2523.74 120.02 2518.52 116.62C2513.3 113.23 2509.24 108.16 2506.35 101.41C2503.46 94.66 2502.01 86.33 2502.01 76.42C2502.01 66.51 2503.42 58.58 2506.25 51.83C2509.08 45.08 2513.13 39.91 2518.42 36.32C2523.71 32.73 2529.97 30.93 2537.22 30.93C2541.21 30.93 2544.86 31.46 2548.19 32.53C2551.51 33.59 2554.42 35.16 2556.92 37.22C2559.41 39.28 2561.46 41.76 2563.05 44.65C2564.65 47.54 2565.74 50.82 2566.34 54.48H2601.95C2600.89 45.84 2598.54 38.14 2594.92 31.39C2591.29 24.64 2586.59 18.94 2580.81 14.28C2575.03 9.63002 2568.37 6.09002 2560.86 3.66002C2553.34 1.23002 2545.16 0.0200195 2536.32 0.0200195C2523.15 0.0200195 2511.25 2.98002 2500.61 8.90002C2489.97 14.82 2481.54 23.46 2475.33 34.83C2469.11 46.2 2466 60.06 2466 76.42C2466 92.78 2469.08 106.44 2475.23 117.81C2481.38 129.18 2489.76 137.83 2500.37 143.74L2500.35 143.75Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M2667.74 143.4C2678.45 149.55 2690.85 152.63 2704.95 152.63C2717.65 152.63 2728.94 150.1 2738.81 145.05C2748.69 140 2756.41 132.73 2762 123.25C2767.59 113.78 2770.38 102.42 2770.38 89.19V69.64H2706.64V95.47H2736.34C2736.21 100.61 2735.03 105.12 2732.77 108.98C2730.38 113.07 2726.87 116.21 2722.25 118.41C2717.63 120.6 2711.96 121.7 2705.24 121.7C2697.79 121.7 2691.41 119.91 2686.09 116.31C2680.77 112.72 2676.7 107.53 2673.87 100.75C2671.04 93.97 2669.63 85.76 2669.63 76.11C2669.63 66.46 2671.08 58.37 2673.97 51.62C2676.86 44.87 2680.99 39.74 2686.34 36.21C2691.69 32.69 2697.96 30.92 2705.14 30.92C2708.86 30.92 2712.24 31.35 2715.26 32.22C2718.28 33.08 2721 34.36 2723.39 36.06C2725.78 37.76 2727.79 39.82 2729.42 42.24C2731.05 44.67 2732.3 47.41 2733.16 50.47H2768.77C2767.84 43.09 2765.59 36.32 2762.04 30.17C2758.48 24.02 2753.83 18.68 2748.08 14.16C2742.33 9.64 2735.78 6.15 2728.43 3.69C2721.08 1.23 2713.12 0 2704.54 0C2691.31 0 2679.35 3.01 2668.68 9.03C2658.01 15.05 2649.5 23.76 2643.15 35.16C2636.8 46.57 2633.62 60.38 2633.62 76.6C2633.62 92.82 2636.63 105.73 2642.65 117.1C2648.67 128.47 2657.03 137.23 2667.74 143.38V143.4Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M2157.79 204.07C2121.45 204.59 2070.56 199.57 2036.44 204.5C2001.64 209.53 1961.93 273.41 1928.72 293.17C1901.36 309.46 1857.99 313.06 1814.7 312.92V312.97L1441.74 309.06V941.93H1729.54V530.79H1770.65V941.93H2047.03V530.79H2085.86V941.93H2375.94V240.71L2337.09 202.78C2277.22 203.01 2217.39 203.2 2157.78 204.06L2157.79 204.07Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                        <path 
                          d="M0 141.79V941.94H558.94L645.79 847.67V233.76L558.94 141.79H0ZM361.6 696.54L259.6 605.11L66.83 790.9L184.63 535.89L60.06 432.97L231.68 431.35L301.35 263.53L326.54 433.57L494.63 433.83L342.79 538.35L361.6 696.53V696.54Z"
                          className={logoTextColor}
                          fill="currentColor"
                        />
                      </svg>
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
                          onSearch={(query) => {
                            setIsMobileSearchOpen(false)
                            // Navigate to cards page with search query
                            if (query) {
                              window.location.href = `/cards?search=${encodeURIComponent(query)}`
                            } else {
                              window.location.href = `/cards?search=pokemon`
                            }
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
