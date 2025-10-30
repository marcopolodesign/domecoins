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
                        viewBox="0 0 3000 942"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="block mt-1"
                      >
                        <path 
                          d="M712.04 236.73L711.51 941.5L1285.85 941.93L1375.16 848.18L1375.69 145.7L803.63 145.27L712.03 236.73H712.04ZM1025.5 273.58L1064.4 273.61L1064 806.77L1025.1 806.74L1025.5 273.58Z"
         
                          fill="#ffffff"
                        />
                        <path 
                          d="M3000 391.47V147.07H2826.19C2801.77 178.9 2779.44 200.82 2737.43 204.06L2477.13 203.98L2442.67 238.44V941.95H2999.99V692.98H2764.73V656.43H2999.99V432.59H2764.73V391.48H2999.99L3000 391.47Z"
              
                          fill="#ffffff"
                        />
                        <path 
                          d="M2317.1 30.74H2362.09V150.63H2397.2V30.74H2442.18V2.01001H2317.1V30.74Z"
                  
                          fill="#ffffff"
                        />
                        <path 
                          d="M2500.35 143.75C2510.96 149.67 2522.94 152.63 2536.31 152.63C2546.42 152.63 2555.39 151.07 2563.24 147.94C2571.08 144.81 2577.79 140.61 2583.34 135.32C2588.89 130.03 2593.23 124.18 2596.36 117.76C2599.48 111.34 2601.38 104.81 2602.05 98.16H2566.44C2565.84 101.82 2564.71 105.09 2563.05 107.99C2561.39 110.88 2559.29 113.36 2556.77 115.42C2554.24 117.48 2551.32 119.05 2547.99 120.11C2544.66 121.18 2541.01 121.71 2537.02 121.71C2529.9 121.71 2523.74 120.02 2518.52 116.62C2513.3 113.23 2509.24 108.16 2506.35 101.41C2503.46 94.66 2502.01 86.33 2502.01 76.42C2502.01 66.51 2503.42 58.58 2506.25 51.83C2509.08 45.08 2513.13 39.91 2518.42 36.32C2523.71 32.73 2529.97 30.93 2537.22 30.93C2541.21 30.93 2544.86 31.46 2548.19 32.53C2551.51 33.59 2554.42 35.16 2556.92 37.22C2559.41 39.28 2561.46 41.76 2563.05 44.65C2564.65 47.54 2565.74 50.82 2566.34 54.48H2601.95C2600.89 45.84 2598.54 38.14 2594.92 31.39C2591.29 24.64 2586.59 18.94 2580.81 14.28C2575.03 9.63002 2568.37 6.09002 2560.86 3.66002C2553.34 1.23002 2545.16 0.0200195 2536.32 0.0200195C2523.15 0.0200195 2511.25 2.98002 2500.61 8.90002C2489.97 14.82 2481.54 23.46 2475.33 34.83C2469.11 46.2 2466 60.06 2466 76.42C2466 92.78 2469.08 106.44 2475.23 117.81C2481.38 129.18 2489.76 137.83 2500.37 143.74L2500.35 143.75Z"
                        
                          fill="#ffffff"
                        />
                        <path 
                          d="M2667.74 143.4C2678.45 149.55 2690.85 152.63 2704.95 152.63C2717.65 152.63 2728.94 150.1 2738.81 145.05C2748.69 140 2756.41 132.73 2762 123.25C2767.59 113.78 2770.38 102.42 2770.38 89.19V69.64H2706.64V95.47H2736.34C2736.21 100.61 2735.03 105.12 2732.77 108.98C2730.38 113.07 2726.87 116.21 2722.25 118.41C2717.63 120.6 2711.96 121.7 2705.24 121.7C2697.79 121.7 2691.41 119.91 2686.09 116.31C2680.77 112.72 2676.7 107.53 2673.87 100.75C2671.04 93.97 2669.63 85.76 2669.63 76.11C2669.63 66.46 2671.08 58.37 2673.97 51.62C2676.86 44.87 2680.99 39.74 2686.34 36.21C2691.69 32.69 2697.96 30.92 2705.14 30.92C2708.86 30.92 2712.24 31.35 2715.26 32.22C2718.28 33.08 2721 34.36 2723.39 36.06C2725.78 37.76 2727.79 39.82 2729.42 42.24C2731.05 44.67 2732.3 47.41 2733.16 50.47H2768.77C2767.84 43.09 2765.59 36.32 2762.04 30.17C2758.48 24.02 2753.83 18.68 2748.08 14.16C2742.33 9.64 2735.78 6.15 2728.43 3.69C2721.08 1.23 2713.12 0 2704.54 0C2691.31 0 2679.35 3.01 2668.68 9.03C2658.01 15.05 2649.5 23.76 2643.15 35.16C2636.8 46.57 2633.62 60.38 2633.62 76.6C2633.62 92.82 2636.63 105.73 2642.65 117.1C2648.67 128.47 2657.03 137.23 2667.74 143.38V143.4Z"
              
                          fill="#ffffff"
                        />
                        <path 
                          d="M2157.79 204.07C2121.45 204.59 2070.56 199.57 2036.44 204.5C2001.64 209.53 1961.93 273.41 1928.72 293.17C1901.36 309.46 1857.99 313.06 1814.7 312.92V312.97L1441.74 309.06V941.93H1729.54V530.79H1770.65V941.93H2047.03V530.79H2085.86V941.93H2375.94V240.71L2337.09 202.78C2277.22 203.01 2217.39 203.2 2157.78 204.06L2157.79 204.07Z"
          
                          fill="#ffffff"
                        />
                        <path 
                          d="M0 141.79V941.94H558.94L645.79 847.67V233.76L558.94 141.79H0ZM361.6 696.54L259.6 605.11L66.83 790.9L184.63 535.89L60.06 432.97L231.68 431.35L301.35 263.53L326.54 433.57L494.63 433.83L342.79 538.35L361.6 696.53V696.54Z"
                     
                          fill="#ffffff"
                        />
                      </svg>
                      </div>
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

