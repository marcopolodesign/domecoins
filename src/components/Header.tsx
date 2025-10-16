'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Disclosure } from '@headlessui/react'
import { 
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
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
  { name: 'Cartas', href: '/sets' },
  { name: 'Accesorios', href: '/rarezas' },
  { name: 'Sellados', href: '/rarezas' },
  { name: 'En stock', href: '/stock' },
]

// Custom Pokedex/Card icon with badge
function PokedexIcon({ count, className }: { count: number; className?: string }) {
  return (
    <div className="relative">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        className={className}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="6" rx="1" />
        <circle cx="12" cy="17" r="1.5" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
  
  const isHomePage = pathname === '/'
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // GSAP scroll animation for header
  useEffect(() => {
    if (headerRef.current && noticesRef.current) {
      const header = headerRef.current
      const notices = noticesRef.current
      
      // Create scroll trigger for header animations
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const scrollY = self.scroll()
          
          // Smooth animations for notices and header
          if (scrollY > 50) {
            setIsScrolled(true)
            
            // Move notices up smoothly
            gsap.to(notices, {
              y: -notices.offsetHeight,
              duration: 0.3,
              ease: "power2.out"
            })
            
            // Move header up slightly
            gsap.to(header, {
              y: -35,
              duration: 0.3,
              ease: "power2.out"
            })
          } else {
            setIsScrolled(false)
            
            // Move notices back down
            gsap.to(notices, {
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            })
            
            // Move header back to original position
            gsap.to(header, {
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            })
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

  // Determine text colors based on page and scroll state
  const textColor = (isHomePage && !isScrolled) ? 'text-white' : 'text-gray-900'
  const logoTextColor = (isHomePage && !isScrolled) ? 'text-white' : 'text-gray-900'
  const hoverColor = (isHomePage && !isScrolled) ? 'hover:text-white/80' : 'hover:text-blue-600'

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Notices Section */}
      <div 
        ref={noticesRef}
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white relative transition-transform duration-300 ease-out"
      >
        <div className="container-custom py-3">
          <div className="flex items-center justify-center text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2 animate-pulse" />
            <span className="font-medium">
              ¡Nuevas cartas llegando todos los días! Envío gratis en compras superiores a $50.000
            </span>
            <button 
              className="ml-3 text-xs underline hover:no-underline"
              onClick={() => {
                if (noticesRef.current) {
                  gsap.to(noticesRef.current, {
                    y: -noticesRef.current.offsetHeight,
                    duration: 0.3,
                    ease: "power2.out"
                  })
                }
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <Disclosure as="nav" ref={headerRef} className={`
        transition-all duration-300 ease-out rounded-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
        ${(isHomePage && !isScrolled) 
          ? 'bg-transparent ' 
          : 'translate-y-20 bg-gray-300'
        }
      `}>
        {({ open }) => (
          <>
            <div className="">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="white"
                        className="h-6 w-6"
                      >
                        <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                        <line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <span className={`text-4xl font-thunder uppercase font-ultra leading-[1] block mt-1 ${logoTextColor}`}>
                        DomeTCG
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Center: Navigation or SearchBox */}
                {!isHomePage && (
                  // Other pages: Show search box in header
                  <div className="hidden md:block flex-1 max-w-2xl mx-8">
                    <SearchBox variant="header" />
                  </div>
                )}

                {/* Right side: Cart and User */}
                <div className="flex items-center space-x-6">

                  {isHomePage && (
                      // Home page: Show navigation links
                      <div className="hidden md:flex items-center space-x-8 mr-8">
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
                    )}
                    
                  {/* Cart with total */}
                  <button
                    onClick={handleCartClick}
                    className={`flex items-center space-x-2 ${textColor} ${hoverColor} transition-colors duration-200`}
                  >
                    <PokedexIcon count={totalItems} className="h-7 w-7" />
                    <span className="text-lg font-semibold">
                      ${cartTotal.ars.toFixed(2)}
                    </span>
                  </button>

                  {/* User icon */}
                  <button className={`${textColor} ${hoverColor} transition-colors duration-200`}>
                    <UserCircleIcon className="h-8 w-8" />
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
        )}
      </Disclosure>
    </div>
  )
}
