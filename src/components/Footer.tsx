'use client'

import Link from 'next/link'

const navigation = [
  { name: 'Cartas', href: '/cards' },
  { name: 'En Stock', href: '/cards?inStock=true' },
  { name: 'Carrito', href: '#', onClick: 'cart' },
  { name: 'Checkout', href: '/checkout' },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo Section */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 border-2 border-white rounded-full flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="h-6 w-6 text-white"
                >
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" className="text-white" fill="currentColor"/>
                  <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-3xl font-thunder uppercase font-ultra leading-[1] text-white">
                DomeTCG
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Tu tienda de confianza para cartas Pokémon TCG en Argentina
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:ml-auto">
            <h3 className="text-white font-semibold mb-4">Navegación</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.onClick === 'cart' ? (
                    <button
                      onClick={() => {
                        // Dispatch cart toggle event
                        const event = new CustomEvent('toggleCart')
                        window.dispatchEvent(event)
                      }}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:ml-auto">
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://wa.me/5491131160311" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  WhatsApp: +54 9 11 3116-0311
                </a>
              </li>
              <li className="text-gray-400">
                Buenos Aires, Argentina
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} DomeTCG. Todos los derechos reservados<sup>®</sup>
          </p>
          <p className="text-sm text-gray-400">
            Hecho por{' '}
            <a 
              href="https://marcopolo.agency" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              Marco Polo
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

